// Document Upload Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const upload = require('../middleware/uploadMiddleware');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/documents/upload - Upload document to request
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { request_id, user_id } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    if (!request_id || !user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing request_id or user_id'
      });
    }

    // Verify user has access to this request
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
        error: 'Unauthorized to upload to this request'
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${request_id}/${timestamp}-${file.originalname}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('request-documents')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: 'Failed to upload file'
      });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('request-documents')
      .getPublicUrl(fileName);

    // Save document record
    const { data: docData, error: docError } = await supabase
      .from('request_documents')
      .insert({
        request_id: request_id,
        uploaded_by: user_id,
        file_url: urlData.publicUrl,
        file_name: file.originalname,
        file_size: file.size,
        file_type: file.mimetype
      })
      .select()
      .single();

    if (docError) {
      console.error('Database error:', docError);
      return res.status(500).json({
        success: false,
        error: 'Failed to save document record'
      });
    }

    res.json({
      success: true,
      document: docData
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/documents/request/:request_id - Get all documents for a request
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
        error: 'Unauthorized to view these documents'
      });
    }

    // Get documents
    const { data: documents, error } = await supabase
      .from('request_documents')
      .select('*, profiles!request_documents_uploaded_by_fkey(full_name, role)')
      .eq('request_id', request_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      documents: documents || []
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/documents/:id - Delete a document
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id'
      });
    }

    // Get document
    const { data: document, error: docError } = await supabase
      .from('request_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (docError || !document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if user is uploader or admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    const isUploader = document.uploaded_by === user_id;
    const isAdmin = userProfile?.role?.includes('admin');

    if (!isUploader && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this document'
      });
    }

    // Extract file path from URL
    const urlParts = document.file_url.split('/request-documents/');
    const filePath = urlParts[1];

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('request-documents')
      .remove([filePath]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('request_documents')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
