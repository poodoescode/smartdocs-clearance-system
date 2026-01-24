// API Service - Centralized API calls to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ============================================
// REQUEST ENDPOINTS
// ============================================

// Create new clearance request
export const createRequest = async (studentId, docTypeId) => {
  const response = await fetch(`${API_URL}/requests/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId, doc_type_id: docTypeId })
  });
  return response.json();
};

// Get all requests for a student
export const getStudentRequests = async (studentId) => {
  const response = await fetch(`${API_URL}/requests/student/${studentId}`);
  return response.json();
};

// Resubmit a request
export const resubmitRequest = async (requestId, studentId) => {
  const response = await fetch(`${API_URL}/requests/${requestId}/resubmit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId })
  });
  return response.json();
};

// Get requests for admin by role
export const getAdminRequests = async (role) => {
  const response = await fetch(`${API_URL}/requests/admin/${role}`);
  return response.json();
};

// Approve a request
export const approveRequest = async (requestId, adminId) => {
  const response = await fetch(`${API_URL}/requests/${requestId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId })
  });
  return response.json();
};

// Reject a request
export const rejectRequest = async (requestId, adminId, reason) => {
  const response = await fetch(`${API_URL}/requests/${requestId}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId, reason })
  });
  return response.json();
};

// Get request history
export const getRequestHistory = async (requestId) => {
  const response = await fetch(`${API_URL}/requests/${requestId}/history`);
  return response.json();
};

// Delete a request (student only - pending or on_hold status)
export const deleteRequest = async (requestId, studentId) => {
  const response = await fetch(`${API_URL}/requests/${requestId}/delete`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: studentId })
  });
  return response.json();
};

// ============================================
// DOCUMENT UPLOAD ENDPOINTS
// ============================================

// Upload document to request
export const uploadDocument = async (requestId, userId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('request_id', requestId);
  formData.append('user_id', userId);

  const response = await fetch(`${API_URL}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  return response.json();
};

// Get documents for a request
export const getRequestDocuments = async (requestId, userId) => {
  const response = await fetch(`${API_URL}/documents/request/${requestId}?user_id=${userId}`);
  return response.json();
};

// Delete a document
export const deleteDocument = async (documentId, userId) => {
  const response = await fetch(`${API_URL}/documents/${documentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

// ============================================
// COMMENT ENDPOINTS
// ============================================

// Create comment on request
export const createComment = async (requestId, userId, commentText) => {
  const response = await fetch(`${API_URL}/comments/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, user_id: userId, comment_text: commentText })
  });
  return response.json();
};

// Get comments for a request
export const getRequestComments = async (requestId, userId) => {
  const response = await fetch(`${API_URL}/comments/request/${requestId}?user_id=${userId}`);
  return response.json();
};

// Update comment
export const updateComment = async (commentId, userId, commentText) => {
  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, comment_text: commentText })
  });
  return response.json();
};

// Delete comment
export const deleteComment = async (commentId, userId) => {
  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId })
  });
  return response.json();
};

// ============================================
// CERTIFICATE ENDPOINTS
// ============================================

// Generate certificate for completed request
export const generateCertificate = async (requestId, userId) => {
  const response = await fetch(`${API_URL}/certificates/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, user_id: userId })
  });
  return response.json();
};

// Get certificate for a request
export const getRequestCertificate = async (requestId, userId) => {
  const response = await fetch(`${API_URL}/certificates/request/${requestId}?user_id=${userId}`);
  return response.json();
};

// Verify certificate by code
export const verifyCertificate = async (verificationCode) => {
  const response = await fetch(`${API_URL}/certificates/verify/${verificationCode}`);
  return response.json();
};

// ============================================
// ESCALATION ENDPOINTS
// ============================================

// Manually trigger escalation check (admin only)
export const checkEscalations = async (adminId) => {
  const response = await fetch(`${API_URL}/escalation/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_id: adminId })
  });
  return response.json();
};

// Get escalation statistics (admin only)
export const getEscalationStats = async (adminId) => {
  const response = await fetch(`${API_URL}/escalation/stats?admin_id=${adminId}`);
  return response.json();
};

// Manually escalate a request (admin only)
export const manuallyEscalateRequest = async (requestId, adminId, reason) => {
  const response = await fetch(`${API_URL}/escalation/manual`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request_id: requestId, admin_id: adminId, reason })
  });
  return response.json();
};

// Get escalation history for a request
export const getEscalationHistory = async (requestId, userId) => {
  const response = await fetch(`${API_URL}/escalation/history/${requestId}?user_id=${userId}`);
  return response.json();
};
