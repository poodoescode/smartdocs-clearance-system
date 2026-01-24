// Notification Service - Email Only
const nodemailer = require('nodemailer');
const supabase = require('../supabaseClient');

// Initialize email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Send email notification
 */
async function sendEmail(userId, requestId, recipient, subject, message) {
  try {
    // Log notification attempt
    const { data: logData } = await supabase
      .from('notification_logs')
      .insert({
        user_id: userId,
        request_id: requestId,
        type: 'email',
        recipient: recipient,
        subject: subject,
        message: message,
        status: 'pending'
      })
      .select()
      .single();

    // Send email
    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject: subject,
      html: message
    });

    // Update log as sent
    await supabase
      .from('notification_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', logData.id);

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error('❌ Email error:', error);

    // Update log as failed
    if (logData?.id) {
      await supabase
        .from('notification_logs')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', logData.id);
    }

    return { success: false, error: error.message };
  }
}

/**
 * Send SMS notification (DISABLED - Email only system)
 */
async function sendSMS(userId, requestId, recipient, message) {
  console.log('⚠️ SMS notifications are disabled. Email-only system.');
  return { success: false, error: 'SMS notifications not configured' };
}

/**
 * Notify on request submission
 */
async function notifyRequestSubmitted(requestId, studentId) {
  try {
    // Get student and request details
    const { data: request } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .eq('id', requestId)
      .single();

    if (!request) return;

    const student = request.profiles;
    const docType = request.document_types;

    // Email to student
    const emailSubject = `Request Submitted - ${docType.name}`;
    const emailMessage = `
      <h2>Request Submitted Successfully</h2>
      <p>Dear ${student.full_name},</p>
      <p>Your request for <strong>${docType.name}</strong> has been submitted successfully.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Status:</strong> Pending</p>
      <p><strong>Current Stage:</strong> ${docType.required_stages[0]}</p>
      <p>You will receive notifications as your request progresses through each stage.</p>
      <br>
      <p>Best regards,<br>SmartDocs Team</p>
    `;

    await sendEmail(studentId, requestId, student.email || student.full_name, emailSubject, emailMessage);

  } catch (error) {
    console.error('Error in notifyRequestSubmitted:', error);
  }
}

/**
 * Notify on request approval
 */
async function notifyRequestApproved(requestId, studentId, stageName, isCompleted) {
  try {
    // Get student and request details
    const { data: request } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .eq('id', requestId)
      .single();

    if (!request) return;

    const student = request.profiles;
    const docType = request.document_types;

    const emailSubject = isCompleted 
      ? `Clearance Completed - ${docType.name}`
      : `Request Approved - ${stageName} Stage`;

    const emailMessage = isCompleted
      ? `
        <h2>🎉 Clearance Completed!</h2>
        <p>Dear ${student.full_name},</p>
        <p>Congratulations! Your request for <strong>${docType.name}</strong> has been fully approved.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Status:</strong> Completed</p>
        <p>You can now download your clearance certificate from the SmartDocs dashboard.</p>
        <br>
        <p>Best regards,<br>SmartDocs Team</p>
      `
      : `
        <h2>Request Approved</h2>
        <p>Dear ${student.full_name},</p>
        <p>Your request for <strong>${docType.name}</strong> has been approved at the <strong>${stageName}</strong> stage.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Status:</strong> Approved</p>
        <p><strong>Next Stage:</strong> ${docType.required_stages[request.current_stage_index]}</p>
        <p>Your request is now being processed at the next stage.</p>
        <br>
        <p>Best regards,<br>SmartDocs Team</p>
      `;

    await sendEmail(studentId, requestId, student.email || student.full_name, emailSubject, emailMessage);

  } catch (error) {
    console.error('Error in notifyRequestApproved:', error);
  }
}

/**
 * Notify on request rejection
 */
async function notifyRequestRejected(requestId, studentId, stageName, reason) {
  try {
    // Get student and request details
    const { data: request } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .eq('id', requestId)
      .single();

    if (!request) return;

    const student = request.profiles;
    const docType = request.document_types;

    const emailSubject = `Request On Hold - ${docType.name}`;
    const emailMessage = `
      <h2>Request Placed On Hold</h2>
      <p>Dear ${student.full_name},</p>
      <p>Your request for <strong>${docType.name}</strong> has been placed on hold at the <strong>${stageName}</strong> stage.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Status:</strong> On Hold</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please address the issue mentioned above and resubmit your request from the SmartDocs dashboard.</p>
      <br>
      <p>Best regards,<br>SmartDocs Team</p>
    `;

    await sendEmail(studentId, requestId, student.email || student.full_name, emailSubject, emailMessage);

  } catch (error) {
    console.error('Error in notifyRequestRejected:', error);
  }
}

/**
 * Notify on request escalation
 */
async function notifyRequestEscalated(requestId, escalationLevel, daysPending) {
  try {
    // Get request details
    const { data: request } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .eq('id', requestId)
      .single();

    if (!request) return;

    const student = request.profiles;
    const docType = request.document_types;
    const currentStage = docType.required_stages[request.current_stage_index];

    // Notify super admin
    const emailSubject = `⚠️ Request Escalated - Level ${escalationLevel}`;
    const emailMessage = `
      <h2>Request Escalation Alert</h2>
      <p>A request has been pending for <strong>${daysPending} days</strong> and requires attention.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p><strong>Student:</strong> ${student.full_name} (${student.student_number})</p>
      <p><strong>Document Type:</strong> ${docType.name}</p>
      <p><strong>Current Stage:</strong> ${currentStage}</p>
      <p><strong>Escalation Level:</strong> ${escalationLevel}</p>
      <p><strong>Days Pending:</strong> ${daysPending}</p>
      <p>Please review and expedite this request.</p>
      <br>
      <p>SmartDocs Escalation System</p>
    `;

    await sendEmail(
      student.id,
      requestId,
      process.env.SUPER_ADMIN_EMAIL,
      emailSubject,
      emailMessage
    );

    // Also notify student
    const studentEmailSubject = `Request Update - ${docType.name}`;
    const studentEmailMessage = `
      <h2>Request Status Update</h2>
      <p>Dear ${student.full_name},</p>
      <p>Your request for <strong>${docType.name}</strong> has been escalated for faster processing.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p>We are working to expedite your request. You will be notified once it is processed.</p>
      <br>
      <p>Best regards,<br>SmartDocs Team</p>
    `;

    await sendEmail(
      student.id,
      requestId,
      student.email || student.full_name,
      studentEmailSubject,
      studentEmailMessage
    );

  } catch (error) {
    console.error('Error in notifyRequestEscalated:', error);
  }
}

/**
 * Notify on new comment
 */
async function notifyNewComment(requestId, commenterId, commentText) {
  try {
    // Get request and commenter details
    const { data: request } = await supabase
      .from('requests')
      .select('*, document_types(*), profiles!requests_student_id_fkey(*)')
      .eq('id', requestId)
      .single();

    const { data: commenter } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', commenterId)
      .single();

    if (!request || !commenter) return;

    const student = request.profiles;
    const docType = request.document_types;

    // Notify student if commenter is admin
    if (commenterId !== student.id) {
      const emailSubject = `New Comment on Your Request - ${docType.name}`;
      const emailMessage = `
        <h2>New Comment on Your Request</h2>
        <p>Dear ${student.full_name},</p>
        <p><strong>${commenter.full_name}</strong> has commented on your request for <strong>${docType.name}</strong>.</p>
        <p><strong>Request ID:</strong> ${requestId}</p>
        <p><strong>Comment:</strong></p>
        <blockquote style="border-left: 3px solid #28a745; padding-left: 15px; color: #555;">
          ${commentText}
        </blockquote>
        <p>Please check your SmartDocs dashboard for more details.</p>
        <br>
        <p>Best regards,<br>SmartDocs Team</p>
      `;

      await sendEmail(student.id, requestId, student.email || student.full_name, emailSubject, emailMessage);
    }

  } catch (error) {
    console.error('Error in notifyNewComment:', error);
  }
}

module.exports = {
  sendEmail,
  sendSMS,
  notifyRequestSubmitted,
  notifyRequestApproved,
  notifyRequestRejected,
  notifyRequestEscalated,
  notifyNewComment
};
