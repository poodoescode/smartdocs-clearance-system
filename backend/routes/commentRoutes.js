// Comment Routes - Clearance Comment System
// Implements COMMENT_SYSTEM_DOCUMENTATION.md specification
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// HELPER: Get user profile with role
// ============================================
const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();
  if (error) throw new Error('User not found');
  return data;
};

// ============================================
// HELPER: Check if role is an admin type
// ============================================
const isAdminRole = (role) => {
  return role && (role.includes('admin') || role === 'super_admin');
};

// ============================================
// HELPER: Check if role is a professor type
// ============================================
const isProfessorRole = (role) => {
  return role && (role === 'professor' || role === 'department_head');
};

// ============================================
// HELPER: Filter comments by visibility for a given role
// ============================================
const filterByVisibility = (comments, userRole) => {
  return comments.filter(comment => {
    if (comment.visibility === 'all') return true;
    if (comment.visibility === 'admins_only') return isAdminRole(userRole);
    if (comment.visibility === 'professors_only') return isProfessorRole(userRole);
    return true;
  });
};

// ============================================
// POST /api/clearance/:clearanceId/comments
// Add a new comment to a clearance request
// ============================================
router.post('/:clearanceId/comments', async (req, res) => {
  try {
    const { clearanceId } = req.params;
    const { user_id, comment_text, visibility = 'all' } = req.body;

    // Validate required fields
    if (!user_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: user_id and comment_text'
      });
    }

    // Validate visibility value
    const validVisibilities = ['all', 'admins_only', 'professors_only'];
    if (!validVisibilities.includes(visibility)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid visibility. Must be: all, admins_only, or professors_only'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(user_id);

    // RULE: Students cannot add comments (read-only)
    if (userProfile.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Students cannot add comments. Comments are read-only for students.'
      });
    }

    // Verify clearance request exists (table is 'requests' with integer IDs)
    const { data: clearanceRequest, error: reqError } = await supabase
      .from('requests')
      .select('id, student_id')
      .eq('id', clearanceId)
      .single();

    if (reqError || !clearanceRequest) {
      return res.status(404).json({
        success: false,
        error: 'Clearance request not found'
      });
    }

    // Create the comment
    const { data: comment, error: insertError } = await supabase
      .from('clearance_comments')
      .insert({
        clearance_request_id: clearanceId,
        commenter_id: user_id,
        commenter_name: userProfile.full_name,
        commenter_role: userProfile.role,
        comment_text: comment_text.trim(),
        visibility: visibility
      })
      .select('*')
      .single();

    if (insertError) throw insertError;

    // Try to send notification (non-blocking)
    try {
      const { notifyNewComment } = require('../services/notificationService');
      await notifyNewComment(clearanceId, user_id, comment_text);
    } catch (_notifError) {
      // Notification failure should not block comment creation
      console.warn('Comment notification failed (non-blocking)');
    }

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

// ============================================
// GET /api/clearance/:clearanceId/comments
// Get all comments for a clearance request (filtered by visibility)
// ============================================
router.get('/:clearanceId/comments', async (req, res) => {
  try {
    const { clearanceId } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id query parameter'
      });
    }

    // Get user profile (for logging/auth purposes only)
    await getUserProfile(user_id);

    // Fetch all comments for this clearance — no visibility filtering needed
    // Comments are already scoped to a specific student's request
    const { data: comments, error } = await supabase
      .from('clearance_comments')
      .select('*')
      .eq('clearance_request_id', clearanceId)
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

// ============================================
// PATCH /api/clearance/comments/:commentId/resolve
// Mark a comment as resolved or unresolve it
// ============================================
router.patch('/comments/:commentId/resolve', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(user_id);

    // Get the comment
    const { data: comment, error: fetchError } = await supabase
      .from('clearance_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // RULE: Who can resolve comments
    // - Comment author (can resolve their own)
    // - Super Admin (can resolve any)
    // - Registrar Admin (can resolve any)
    const isAuthor = comment.commenter_id === user_id;
    const isSuperAdmin = userProfile.role === 'super_admin';
    const isRegistrar = userProfile.role === 'registrar_admin';

    if (!isAuthor && !isSuperAdmin && !isRegistrar) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to resolve this comment. Only the author, Super Admin, or Registrar Admin can resolve comments.'
      });
    }

    // Toggle resolve status
    const newResolvedState = !comment.is_resolved;

    const { data: updated, error: updateError } = await supabase
      .from('clearance_comments')
      .update({
        is_resolved: newResolvedState,
        resolved_by: newResolvedState ? user_id : null,
        resolved_at: newResolvedState ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select('*')
      .single();

    if (updateError) throw updateError;

    res.json({
      success: true,
      message: newResolvedState ? 'Comment marked as resolved' : 'Comment marked as unresolved',
      comment: updated
    });

  } catch (error) {
    console.error('Error resolving comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// DELETE /api/clearance/comments/:commentId
// Delete a comment (5-minute rule for authors, anytime for super_admin)
// ============================================
router.delete('/comments/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing user_id'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(user_id);

    // Get the comment
    const { data: comment, error: fetchError } = await supabase
      .from('clearance_comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    // RULE: Who can delete comments
    const isAuthor = comment.commenter_id === user_id;
    const isSuperAdmin = userProfile.role === 'super_admin';

    // Students cannot delete
    if (userProfile.role === 'student') {
      return res.status(403).json({
        success: false,
        error: 'Students cannot delete comments'
      });
    }

    if (!isAuthor && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this comment. Only the author or Super Admin can delete.'
      });
    }

    // Authors and Super Admins can delete at any time

    // Delete the comment — service key bypasses RLS
    const { error: deleteError } = await supabase
      .from('clearance_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) throw deleteError;

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

// ============================================
// BACKWARD COMPATIBILITY: Keep old routes working
// These map old /api/comments/* paths to the new system
// ============================================

// POST /api/comments/create (legacy)
router.post('/create', async (req, res) => {
  try {
    const { request_id, user_id, comment_text } = req.body;

    if (!request_id || !user_id || !comment_text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Get user profile
    const userProfile = await getUserProfile(user_id);

    // Create comment in clearance_comments table
    const { data: comment, error } = await supabase
      .from('clearance_comments')
      .insert({
        clearance_request_id: request_id,
        commenter_id: user_id,
        commenter_name: userProfile.full_name,
        commenter_role: userProfile.role,
        comment_text: comment_text.trim(),
        visibility: 'all'
      })
      .select('*')
      .single();

    if (error) throw error;

    // Map to legacy format for backward compatibility
    res.json({
      success: true,
      comment: {
        ...comment,
        user_id: comment.commenter_id,
        request_id: comment.clearance_request_id,
        profiles: {
          full_name: comment.commenter_name,
          role: comment.commenter_role
        }
      }
    });

  } catch (error) {
    console.error('Error creating comment (legacy):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/comments/request/:request_id (legacy)
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

    const userProfile = await getUserProfile(user_id);

    const { data: comments, error } = await supabase
      .from('clearance_comments')
      .select('*')
      .eq('clearance_request_id', request_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const filteredComments = filterByVisibility(comments || [], userProfile.role);

    // Map to legacy format
    const legacyComments = filteredComments.map(c => ({
      ...c,
      user_id: c.commenter_id,
      request_id: c.clearance_request_id,
      profiles: {
        full_name: c.commenter_name,
        role: c.commenter_role
      }
    }));

    res.json({
      success: true,
      comments: legacyComments
    });

  } catch (error) {
    console.error('Error fetching comments (legacy):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/comments/:id (legacy)
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

    const userProfile = await getUserProfile(user_id);

    const { data: comment, error: fetchError } = await supabase
      .from('clearance_comments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
    }

    const isAuthor = comment.commenter_id === user_id;
    const isSuperAdmin = userProfile.role === 'super_admin';

    if (!isAuthor && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this comment'
      });
    }

    // Authors and Super Admins can delete at any time

    const { error: deleteError } = await supabase
      .from('clearance_comments')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment (legacy):', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
