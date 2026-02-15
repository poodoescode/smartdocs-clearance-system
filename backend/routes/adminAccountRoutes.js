// Admin Account Management Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// GET /api/admin/pending-accounts - Get all pending account verifications
router.get('/pending-accounts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('verification_status', 'pending_review')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      accounts: data,
      count: data.length
    });

  } catch (error) {
    console.error('Error fetching pending accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending accounts'
    });
  }
});

// POST /api/admin/approve-account - Approve a pending account
router.post('/approve-account', async (req, res) => {
  try {
    const { userId, adminId } = req.body;

    if (!userId || !adminId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify admin has permission
    const { data: admin, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Only super_admin and registrar_admin can approve accounts
    if (!['super_admin', 'registrar_admin'].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only super admin or registrar admin can approve accounts'
      });
    }

    // Update account status
    const { data, error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'approved',
        account_enabled: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('auth_audit_log').insert({
      user_id: userId,
      action: 'account_approved_by_admin',
      success: true,
      metadata: {
        approved_by: adminId,
        admin_role: admin.role
      }
    });

    // TODO: Send email notification to student
    // await sendApprovalEmail(data.email, data.full_name);

    res.json({
      success: true,
      message: 'Account approved successfully',
      account: data
    });

  } catch (error) {
    console.error('Error approving account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve account'
    });
  }
});

// POST /api/admin/reject-account - Reject a pending account
router.post('/reject-account', async (req, res) => {
  try {
    const { userId, adminId, reason } = req.body;

    if (!userId || !adminId || !reason) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify admin has permission
    const { data: admin, error: adminError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', adminId)
      .single();

    if (adminError || !admin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Only super_admin and registrar_admin can reject accounts
    if (!['super_admin', 'registrar_admin'].includes(admin.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only super admin or registrar admin can reject accounts'
      });
    }

    // Update account status
    const { data, error } = await supabase
      .from('profiles')
      .update({
        verification_status: 'rejected',
        account_enabled: false,
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    // Log the action
    await supabase.from('auth_audit_log').insert({
      user_id: userId,
      action: 'account_rejected_by_admin',
      success: true,
      metadata: {
        rejected_by: adminId,
        admin_role: admin.role,
        reason: reason
      }
    });

    // TODO: Send email notification to student
    // await sendRejectionEmail(data.email, data.full_name, reason);

    res.json({
      success: true,
      message: 'Account rejected',
      account: data
    });

  } catch (error) {
    console.error('Error rejecting account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject account'
    });
  }
});

// GET /api/admin/account-stats - Get account verification statistics
router.get('/account-stats', async (req, res) => {
  try {
    // Get counts for each status
    const { data: pending } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending_review');

    const { data: approved } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'approved');

    const { data: autoApproved } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'auto_approved');

    const { data: rejected } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'rejected');

    res.json({
      success: true,
      stats: {
        pending: pending?.length || 0,
        approved: approved?.length || 0,
        autoApproved: autoApproved?.length || 0,
        rejected: rejected?.length || 0,
        total: (pending?.length || 0) + (approved?.length || 0) + (autoApproved?.length || 0) + (rejected?.length || 0)
      }
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
