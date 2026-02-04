// ============================================
// GRADUATION CLEARANCE ROUTES
// Isabela State University Campus
// ============================================

const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// STUDENT ENDPOINTS
// ============================================

// POST /api/graduation/apply - Student applies for graduation clearance
router.post('/apply', async (req, res) => {
  try {
    const { student_id } = req.body;

    // Check if student already has a pending/active clearance request
    const { data: existing, error: checkError } = await supabase
      .from('requests')
      .select('id, is_completed')
      .eq('student_id', student_id)
      .eq('clearance_type', 'graduation')
      .eq('is_completed', false)
      .single();

    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending graduation clearance request'
      });
    }

    // Get graduation clearance document type
    const { data: docType } = await supabase
      .from('document_types')
      .select('id')
      .eq('name', 'Graduation Clearance')
      .single();

    if (!docType) {
      return res.status(500).json({
        success: false,
        error: 'Graduation clearance type not found in system'
      });
    }

    // Create new graduation clearance request
    const { data: request, error } = await supabase
      .from('requests')
      .insert({
        student_id,
        doc_type_id: docType.id,
        clearance_type: 'graduation',
        current_status: 'pending',
        professors_status: 'pending',
        library_status: 'pending',
        cashier_status: 'pending',
        registrar_status: 'pending',
        is_completed: false
      })
      .select()
      .single();

    if (error) throw error;

    // Professor approvals are auto-created by database trigger

    res.json({
      success: true,
      request,
      message: 'Graduation clearance application submitted successfully'
    });

  } catch (error) {
    console.error('Error applying for clearance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/graduation/cancel/:studentId - Student cancels graduation clearance
router.delete('/cancel/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find the student's pending graduation request
    const { data: existingRequest, error: findError } = await supabase
      .from('requests')
      .select('id, current_status, is_completed')
      .eq('student_id', studentId)
      .eq('clearance_type', 'graduation')
      .eq('is_completed', false)
      .single();

    if (findError || !existingRequest) {
      return res.status(404).json({
        success: false,
        error: 'No pending graduation clearance request found'
      });
    }

    // Only allow cancellation if not yet completed
    if (existingRequest.is_completed) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel a completed clearance request'
      });
    }

    // Delete associated professor approvals first
    await supabase
      .from('professor_approvals')
      .delete()
      .eq('request_id', existingRequest.id);

    // Delete the request
    const { error: deleteError } = await supabase
      .from('requests')
      .delete()
      .eq('id', existingRequest.id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Graduation clearance request cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling clearance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/graduation/status/:studentId - Get student's clearance status
router.get('/status/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;

    // Get clearance request with all details
    const { data: request, error } = await supabase
      .from('clearance_status_view')
      .select('*')
      .eq('student_id', studentId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!request) {
      return res.json({
        success: true,
        hasRequest: false,
        message: 'No clearance request found'
      });
    }

    // Get professor approvals details
    const { data: professorApprovals } = await supabase
      .from('professor_approvals')
      .select(`
        id,
        status,
        comments,
        approved_at,
        professor:professor_id (
          full_name,
          email
        )
      `)
      .eq('request_id', request.request_id);

    res.json({
      success: true,
      hasRequest: true,
      request,
      professorApprovals: professorApprovals || []
    });

  } catch (error) {
    console.error('Error getting clearance status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// PROFESSOR ENDPOINTS
// ============================================

// GET /api/graduation/professor/students/:professorId - Get assigned students
router.get('/professor/students/:professorId', async (req, res) => {
  try {
    const { professorId } = req.params;

    // Get students assigned to this professor with pending approvals
    const { data: approvals, error } = await supabase
      .from('professor_approvals')
      .select(`
        id,
        request_id,
        status,
        comments,
        approved_at,
        request:request_id (
          id,
          created_at,
          professors_status,
          student:student_id (
            id,
            full_name,
            student_number,
            course_year,
            email
          )
        )
      `)
      .eq('professor_id', professorId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      approvals: approvals || []
    });

  } catch (error) {
    console.error('Error getting professor students:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/professor/approve - Professor approves student
router.post('/professor/approve', async (req, res) => {
  try {
    const { approval_id, professor_id, comments } = req.body;

    const { data, error } = await supabase
      .from('professor_approvals')
      .update({
        status: 'approved',
        comments: comments || null,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', approval_id)
      .eq('professor_id', professor_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      approval: data,
      message: 'Student approved successfully'
    });

  } catch (error) {
    console.error('Error approving student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/professor/reject - Professor rejects student
router.post('/professor/reject', async (req, res) => {
  try {
    const { approval_id, professor_id, comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comments are required when rejecting'
      });
    }

    const { data, error } = await supabase
      .from('professor_approvals')
      .update({
        status: 'rejected',
        comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', approval_id)
      .eq('professor_id', professor_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      approval: data,
      message: 'Student rejected with comments'
    });

  } catch (error) {
    console.error('Error rejecting student:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// LIBRARY ADMIN ENDPOINTS
// ============================================

// GET /api/graduation/library/pending - Get students pending library clearance
router.get('/library/pending', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        created_at,
        professors_status,
        library_status,
        library_comments,
        student:student_id (
          id,
          full_name,
          student_number,
          course_year,
          email
        )
      `)
      .eq('clearance_type', 'graduation')
      .eq('professors_status', 'approved')
      .eq('library_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('Error getting library pending:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/library/approve - Library approves
router.post('/library/approve', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    const { data, error } = await supabase
      .from('requests')
      .update({
        library_status: 'approved',
        library_approved_by: admin_id,
        library_approved_at: new Date().toISOString(),
        library_comments: comments || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      message: 'Library clearance approved'
    });

  } catch (error) {
    console.error('Error approving library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/library/reject - Library rejects
router.post('/library/reject', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comments are required when rejecting'
      });
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        library_status: 'rejected',
        library_approved_by: admin_id,
        library_comments: comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      message: 'Library clearance rejected'
    });

  } catch (error) {
    console.error('Error rejecting library:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// CASHIER ADMIN ENDPOINTS
// ============================================

// GET /api/graduation/cashier/pending - Get students pending cashier clearance
router.get('/cashier/pending', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        created_at,
        professors_status,
        library_status,
        cashier_status,
        cashier_comments,
        student:student_id (
          id,
          full_name,
          student_number,
          course_year,
          email
        )
      `)
      .eq('clearance_type', 'graduation')
      .eq('library_status', 'approved')
      .eq('cashier_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('Error getting cashier pending:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/cashier/approve - Cashier approves
router.post('/cashier/approve', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    const { data, error } = await supabase
      .from('requests')
      .update({
        cashier_status: 'approved',
        cashier_approved_by: admin_id,
        cashier_approved_at: new Date().toISOString(),
        cashier_comments: comments || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      message: 'Cashier clearance approved'
    });

  } catch (error) {
    console.error('Error approving cashier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/cashier/reject - Cashier rejects
router.post('/cashier/reject', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comments are required when rejecting'
      });
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        cashier_status: 'rejected',
        cashier_approved_by: admin_id,
        cashier_comments: comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      message: 'Cashier clearance rejected'
    });

  } catch (error) {
    console.error('Error rejecting cashier:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// REGISTRAR ADMIN ENDPOINTS
// ============================================

// GET /api/graduation/registrar/pending - Get students pending final approval
router.get('/registrar/pending', async (req, res) => {
  try {
    const { data: requests, error } = await supabase
      .from('requests')
      .select(`
        id,
        created_at,
        professors_status,
        library_status,
        cashier_status,
        registrar_status,
        registrar_comments,
        certificate_generated,
        student:student_id (
          id,
          full_name,
          student_number,
          course_year,
          email
        )
      `)
      .eq('clearance_type', 'graduation')
      .eq('cashier_status', 'approved')
      .eq('registrar_status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      requests: requests || []
    });

  } catch (error) {
    console.error('Error getting registrar pending:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/registrar/approve - Registrar final approval + generate certificate
router.post('/registrar/approve', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    // Generate certificate number
    const certificateNumber = `ISU-GC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const { data, error } = await supabase
      .from('requests')
      .update({
        registrar_status: 'approved',
        registrar_approved_by: admin_id,
        registrar_approved_at: new Date().toISOString(),
        registrar_comments: comments || null,
        is_completed: true,
        certificate_generated: true,
        certificate_generated_at: new Date().toISOString(),
        certificate_number: certificateNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      certificateNumber,
      message: 'Graduation clearance completed and certificate generated'
    });

  } catch (error) {
    console.error('Error approving registrar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/graduation/registrar/reject - Registrar rejects
router.post('/registrar/reject', async (req, res) => {
  try {
    const { request_id, admin_id, comments } = req.body;

    if (!comments || comments.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Comments are required when rejecting'
      });
    }

    const { data, error } = await supabase
      .from('requests')
      .update({
        registrar_status: 'rejected',
        registrar_approved_by: admin_id,
        registrar_comments: comments,
        updated_at: new Date().toISOString()
      })
      .eq('id', request_id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      request: data,
      message: 'Registrar clearance rejected'
    });

  } catch (error) {
    console.error('Error rejecting registrar:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ADMIN ENDPOINTS - Manage Professor Assignments
// ============================================

// POST /api/graduation/admin/assign-professor - Assign professor to student
router.post('/admin/assign-professor', async (req, res) => {
  try {
    const { student_id, professor_id, course_code, course_name, semester, academic_year } = req.body;

    const { data, error } = await supabase
      .from('student_professors')
      .insert({
        student_id,
        professor_id,
        course_code,
        course_name,
        semester,
        academic_year,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      assignment: data,
      message: 'Professor assigned successfully'
    });

  } catch (error) {
    console.error('Error assigning professor:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/graduation/admin/professors - Get all professors
router.get('/admin/professors', async (req, res) => {
  try {
    const { data: professors, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, is_active')
      .eq('role', 'professor')
      .order('full_name');

    if (error) throw error;

    res.json({
      success: true,
      professors: professors || []
    });

  } catch (error) {
    console.error('Error getting professors:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
