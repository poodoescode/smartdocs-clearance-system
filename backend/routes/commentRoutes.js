// Comment Routes
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { notifyNewComment } = require('../services/notificationService');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// POST /api/comments/create - Create new comment
router.post('/create', async (req, res) => {
  try {
    const { request_id, user_id, comment_text } = req.body;

    if (!request_id || !user_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
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
        error: 'Unauthorized to comment on this request'
      });
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('request_comments')
      .insert({
        request_id: request_id,
        user_id: user_id,
        comment_text: comment_text.trim()
      })
      .select('*, profiles!request_comments_user_id_fkey(full_name, role)')
      .single();

    if (error) throw error;

    // Send notification
    await notifyNewComment(request_id, user_id, comment_text);

    res.json({
      success: true,
      comment: comment
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/comments/request/:request_id - Get all comments for a request
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
        error: 'Unauthorized to view these comments'
      });
    }

    // Get comments
    const { data: comments, error } = await supabase
      .from('request_comments')
      .select('*, profiles!request_comments_user_id_fkey(full_name, role)')
      .eq('request_id', request_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.json({
      success: true,
      comments: comments || []
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/comments/:id - Update comment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, comment_text } = req.body;

    if (!user_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get comment
    const { data: comment } = await supabase
      .from('request_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user is comment owner
    if (comment.user_id !== user_id) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to edit this comment'
      });
    }

    // Update comment
    const { data: updated, error } = await supabase
      .from('request_comments')
      .update({
        comment_text: comment_text.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, profiles!request_comments_user_id_fkey(full_name, role)')
      .single();

    if (error) throw error;

    res.json({
      success: true,
      comment: updated
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/comments/:id - Delete comment
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

    // Get comment
    const { data: comment } = await supabase
      .from('request_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // Check if user is comment owner or admin
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single();

    const isOwner = comment.user_id === user_id;
    const isAdmin = userProfile?.role?.includes('admin');

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this comment'
      });
    }

    // Delete comment
    const { error } = await supabase
      .from('request_comments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
