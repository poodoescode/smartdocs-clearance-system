// Certificate Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { generateCertificate, verifyCertificate } = require('../services/certificateService');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/certificates/generate - Generate certificate for completed request
router.post('/generate', async (req, res) => {
  try {
    const { request_id, user_id } = req.body;

    if (!request_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Verify request exists and is completed
    const { data: request, error: reqError } = await supabase
      .from('requests')
      .select('*, profiles!requests_student_id_fkey(role)')
      .eq('id', request_id)
      .single();

    if (reqError || !request) {
      return res.status(404).json({
        success: false,
        error: 'Request not found'
      });
    }

    if (!request.is_completed) {
      return res.status(400).json({
        success: false,
        error: 'Request is not completed yet'
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
        error: 'Unauthorized to generate certificate for this request'
      });
    }

    // Generate certificate
    const result = await generateCertificate(request_id);

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json(result);

  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/certificates/request/:request_id - Get certificate for a request
router.get('/request/:request_id', async (req, res) => {
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
        error: 'Unauthorized to view this certificate'
      });
    }

    // Get certificate
    const { data: certificate, error } = await supabase
      .from('clearance_certificates')
      .select('*')
      .eq('request_id', request_id)
      .maybeSingle(); // Use maybeSingle() to handle no results gracefully

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({
        success: false,
        error: 'Error fetching certificate'
      });
    }

    if (!certificate) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    res.json({
      success: true,
      certificate: certificate
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/certificates/verify/:code - Verify certificate by code
router.get('/verify/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await verifyCertificate(code);

    res.json(result);

  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
