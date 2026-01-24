// Escalation Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { 
  checkAndEscalateRequests, 
  getEscalationStats, 
  manuallyEscalateRequest 
} = require('../services/escalationService');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/escalation/check - Manually trigger escalation check (admin only)
router.post('/check', async (req, res) => {
  try {
    const { admin_id } = req.body;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing admin_id'
      });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single();

    if (!admin || !admin.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin access required'
      });
    }

    // Run escalation check
    const result = await checkAndEscalateRequests();

    res.json(result);

  } catch (error) {
    console.error('Error checking escalations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/escalation/stats - Get escalation statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const { admin_id } = req.query;

    if (!admin_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing admin_id'
      });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single();

    if (!admin || !admin.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin access required'
      });
    }

    // Get stats
    const result = await getEscalationStats();

    res.json(result);

  } catch (error) {
    console.error('Error getting escalation stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/escalation/manual - Manually escalate a request (admin only)
router.post('/manual', async (req, res) => {
  try {
    const { request_id, admin_id, reason } = req.body;

    if (!request_id || !admin_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', admin_id)
      .single();

    if (!admin || !admin.role.includes('admin')) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized - admin access required'
      });
    }

    // Manually escalate
    const result = await manuallyEscalateRequest(request_id, admin_id, reason);

    res.json(result);

  } catch (error) {
    console.error('Error manually escalating:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/escalation/history/:request_id - Get escalation history for a request
router.get('/history/:request_id', async (req, res) => {
  try {
    const { request_id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id'
      });
    }

    // Verify user has access to this request
    const { data: request } = await supabase
      .from('requests')
      .select('student_id')
      .eq('id', request_id)
      .single();

    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    // Check if user is student owner or admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    const isOwner = request.student_id === user_id;
    const isAdmin = userProfile?.role?.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to view escalation history'
      });
    }

    // Get escalation history
    const { data: history, error } = await supabase
      .from('escalation_history')
      .select('*')
      .eq('request_id', request_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      history: history || []
    });

  } catch (error) {
    console.error('Error fetching escalation history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
