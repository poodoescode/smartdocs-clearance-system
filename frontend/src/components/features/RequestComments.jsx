import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { createComment, getRequestComments, deleteComment } from '../../services/api';
import { ConfirmModal } from '../ui/Modal';

export default function RequestComments({ requestId, userId, userRole: _userRole }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, commentId: null });

  useEffect(() => {
    fetchComments();

    // Poll for new comments every 10 seconds
    const interval = setInterval(fetchComments, 10000);
    return () => clearInterval(interval);
  }, [requestId]);

  const fetchComments = async () => {
    try {
      const response = await getRequestComments(requestId, userId);
      if (response.success) {
        setComments(response.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createComment(requestId, userId, newComment);
      if (response.success) {
        toast.success('Comment posted!');
        setNewComment('');
        fetchComments();
      } else {
        toast.error(response.error || 'Failed to post comment');
      }
    } catch (error) {
      toast.error('Error posting comment: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (commentId) => {
    setDeleteConfirm({ show: true, commentId });
  };

  const confirmDelete = async () => {
    const { commentId } = deleteConfirm;
    setDeleteConfirm({ show: false, commentId: null });

    try {
      const response = await deleteComment(commentId, userId);
      if (response.success) {
        toast.success('Comment deleted!');
        fetchComments();
      } else {
        toast.error(response.error || 'Failed to delete comment');
      }
    } catch (error) {
      toast.error('Error deleting comment: ' + error.message);
    }
  };

  const getRoleBadge = (role) => {
    if (role === 'student') {
      return <span className="badge badge-info text-xs">Student</span>;
    }
    if (role.includes('admin')) {
      const adminType = role.replace('_admin', '').split('_').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      return <span className="badge badge-warning text-xs">{adminType} Admin</span>;
    }
    return <span className="badge badge-info text-xs">{role}</span>;
  };

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div>
          <h4 className="font-semibold text-gray-900">Comments & Discussion</h4>
          <p className="text-sm text-gray-600">{comments.length} comments</p>
        </div>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or ask a question..."
          className="input-field min-h-[100px] resize-none mb-3"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="btn-primary"
        >
          {submitting ? 'Posting...' : 'Post Comment'}
        </button>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-500 text-sm mt-2">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-500">No comments yet</p>
          <p className="text-gray-400 text-sm mt-1">Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-l-4 border-primary-500 pl-4 py-3 bg-gray-50 rounded-r-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {comment.profiles.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{comment.profiles.full_name}</span>
                      {getRoleBadge(comment.profiles.role)}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {comment.user_id === userId && (
                  <button
                    onClick={() => handleDelete(comment.id)}
                    className="text-red-600 hover:text-red-700 transition-colors"
                    title="Delete comment"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <p className="text-gray-700 whitespace-pre-wrap">{comment.comment_text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, commentId: null })}
        onConfirm={confirmDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
}
