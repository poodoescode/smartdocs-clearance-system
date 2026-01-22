// API Service - Centralized API calls to backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
