// EcoDocs Request Routes - FSM Workflow Implementation
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { 
  notifyRequestSubmitted, 
  notifyRequestApproved, 
  notifyRequestRejected 
} = require('../services/notificationService');
const { generateCertificate } = require('../services/certificateService');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for admin operations
);

// HELPER: Get admin role from user ID
async function getAdminRole(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  
  if (error) return null;
  return data.role;
}

// HELPER: Format admin role for display (remove _admin suffix)
function formatAdminRole(role) {
  if (!role) return 'Admin';
  // Remove _admin suffix and capitalize
  return role.replace('_admin', '').split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}

// HELPER: Log action to request_history
async function logHistory(requestId, processedBy, previousStatus, newStatus, actionTaken, comments = null) {
  await supabase.from('request_history').insert({
    request_id: requestId,
    processed_by: processedBy,
    previous_status: previousStatus,
    new_status: newStatus,
    action_taken: actionTaken,
    comments: comments
  });
}

// POST /api/requests/create - Create new clearance request
router.post('/create', async (req, res) => {
  try {
    const { student_id, doc_type_id } = req.body;

    // Create new request with initial state
    const { data, error } = await supabase
      .from('requests')
      .insert({
        student_id,
        doc_type_id,
        current_status: 'pending',
        current_stage_index: 0, // Start at first stage
        is_completed: false
      })
      .select()
      .single();

    if (error) throw error;

    // Send notification
    await notifyRequestSubmitted(data.id, student_id);

    res.json({ success: true, request: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/requests/:id/approve - Approve request (FSM: move to next stage)
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id } = req.body; // Admin performing the action

    // Get admin role
    const adminRole = await getAdminRole(admin_id);
    if (!adminRole || !adminRole.includes('admin')) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get current request and document type
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*, document_types(*)')
      .eq('id', id)
      .single();

    if (reqError) throw reqError;

    // Extract current stage from required_stages array
    const currentStage = request.document_types.required_stages[request.current_stage_index];
    
    // Role-based access control: only correct admin can approve their stage
    // e.g., library_admin can only approve 'library' stage
    const requiredRole = `${currentStage}_admin`;
    if (adminRole !== requiredRole && adminRole !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: `Only ${requiredRole} can approve this stage` 
      });
    }

    // FSM Logic: Move to next stage
    const nextStageIndex = request.current_stage_index + 1;
    const isLastStage = nextStageIndex >= request.document_types.required_stages.length;

    // Update request state
    const { data: updated, error: updateError } = await supabase
      .from('requests')
      .update({
        current_stage_index: isLastStage ? request.current_stage_index : nextStageIndex,
        current_status: isLastStage ? 'completed' : 'approved',
        is_completed: isLastStage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log action to history
    await logHistory(
      id,
      admin_id,
      request.current_status,
      isLastStage ? 'completed' : 'approved',
      'approved',
      `Approved by ${formatAdminRole(adminRole)} at ${currentStage} stage`
    );

    // Send notification
    await notifyRequestApproved(id, request.student_id, currentStage, isLastStage);

    // Auto-generate certificate if completed
    if (isLastStage) {
      await generateCertificate(id);
    }

    res.json({ 
      success: true, 
      request: updated,
      message: isLastStage ? 'Request completed!' : 'Moved to next stage'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/requests/:id/reject - Reject request (FSM: move to on_hold)
router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_id, reason } = req.body; // Admin and rejection reason

    if (!reason) {
      return res.status(400).json({ success: false, error: 'Rejection reason required' });
    }

    // Get admin role
    const adminRole = await getAdminRole(admin_id);
    if (!adminRole || !adminRole.includes('admin')) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get current request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*, document_types(*)')
      .eq('id', id)
      .single();

    if (reqError) throw reqError;

    // Role-based access control
    const currentStage = request.document_types.required_stages[request.current_stage_index];
    const requiredRole = `${currentStage}_admin`;
    if (adminRole !== requiredRole && adminRole !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        error: `Only ${requiredRole} can reject this stage` 
      });
    }

    // FSM Logic: Move to on_hold status
    const { data: updated, error: updateError } = await supabase
      .from('requests')
      .update({
        current_status: 'on_hold',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log rejection to history
    await logHistory(
      id,
      admin_id,
      request.current_status,
      'on_hold',
      'rejected',
      reason
    );

    // Send notification
    await notifyRequestRejected(id, request.student_id, currentStage, reason);

    res.json({ 
      success: true, 
      request: updated,
      message: 'Request rejected and put on hold'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/requests/:id/resubmit - Resubmit request (FSM: return to rejecting stage)
router.post('/:id/resubmit', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body; // Student resubmitting

    // Get current request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .eq('student_id', student_id) // Ensure student owns this request
      .single();

    if (reqError) throw reqError;

    // Only allow resubmit if status is on_hold
    if (request.current_status !== 'on_hold') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only resubmit requests that are on hold' 
      });
    }

    // FSM Logic: Return to pending status at same stage
    const { data: updated, error: updateError } = await supabase
      .from('requests')
      .update({
        current_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log resubmission to history
    await logHistory(
      id,
      student_id,
      'on_hold',
      'pending',
      'resubmitted',
      'Student resubmitted request'
    );

    res.json({ 
      success: true, 
      request: updated,
      message: 'Request resubmitted for review'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/requests/student/:student_id - Get all requests for a student
router.get('/student/:student_id', async (req, res) => {
  try {
    const { student_id } = req.params;

    const { data, error } = await supabase
      .from('requests')
      .select('*, document_types(*)')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, requests: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/requests/admin/:role - Get requests for specific admin role
router.get('/admin/:role', async (req, res) => {
  try {
    const { role } = req.params; // e.g., 'library_admin'

    // Extract stage name from role (e.g., 'library' from 'library_admin')
    const stageName = role.replace('_admin', '');

    // Get all document types that include this stage
    const { data: docTypes, error: docError } = await supabase
      .from('document_types')
      .select('id, required_stages');

    if (docError) throw docError;

    // Find requests where current stage matches admin's role
    const { data: requests, error: reqError } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(full_name, student_number)')
      .in('current_status', ['pending', 'approved'])
      .order('created_at', { ascending: true });

    if (reqError) throw reqError;

    // Filter requests where current stage matches admin role
    const filteredRequests = requests.filter(req => {
      const currentStage = req.document_types.required_stages[req.current_stage_index];
      return currentStage === stageName;
    });

    res.json({ success: true, requests: filteredRequests });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/requests/:id/history - Get request history
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('request_history')
      .select('*, profiles!request_history_processed_by_fkey(full_name, role)')
      .eq('request_id', id)
      .order('timestamp', { ascending: false });

    if (error) throw error;

    res.json({ success: true, history: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/requests/:id/delete - Delete request (student only, pending/on_hold only)
router.delete('/:id/delete', async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.body;

    // Get current request
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .eq('student_id', student_id) // Ensure student owns this request
      .single();

    if (reqError) throw reqError;

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Request not found or you do not have permission to delete it' 
      });
    }

    // Only allow deletion if status is pending or on_hold
    if (request.current_status !== 'pending' && request.current_status !== 'on_hold') {
      return res.status(400).json({ 
        success: false, 
        error: 'Can only delete requests that are pending or on hold' 
      });
    }

    // Delete the request (CASCADE will delete history)
    const { error: deleteError } = await supabase
      .from('requests')
      .delete()
      .eq('id', id)
      .eq('student_id', student_id);

    if (deleteError) throw deleteError;

    res.json({ 
      success: true, 
      message: 'Request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
