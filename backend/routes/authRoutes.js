// Authentication Routes with reCAPTCHA verification
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Verify reCAPTCHA token
async function verifyRecaptcha(token) {
  try {
    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, 'error-codes': ['network-error'] };
  }
}

// POST /api/auth/signup - Create new user account with reCAPTCHA
router.post('/signup', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      studentNumber, 
      courseYear,
      recaptchaToken,
      adminSecretCode 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // ADMIN-ONLY SIGNUP VALIDATION
    // Only admin roles can signup, students must be created by admins
    const adminRoles = ['library_admin', 'cashier_admin', 'registrar_admin', 'super_admin'];
    
    if (!adminRoles.includes(role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Student accounts must be created by administration. Please contact your admin office.' 
      });
    }

    // Validate admin secret code
    if (!adminSecretCode || adminSecretCode.trim().length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid admin secret code is required' 
      });
    }

    // Verify admin secret code from database
    const { data: codeData, error: codeError } = await supabase
      .from('admin_secret_codes')
      .select('*')
      .eq('code', adminSecretCode)
      .eq('role', role)
      .eq('is_active', true)
      .single();

    if (codeError || !codeData) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired admin secret code' 
      });
    }

    // Check if code has expired
    if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin secret code has expired' 
      });
    }

    // Check if code has reached max uses
    if (codeData.current_uses >= codeData.max_uses) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin secret code has reached maximum uses' 
      });
    }

    // Validate reCAPTCHA token
    if (!recaptchaToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please complete the reCAPTCHA verification' 
      });
    }

    // Verify reCAPTCHA with Google
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);

    if (!recaptchaResult.success) {
      console.error('reCAPTCHA verification failed:', recaptchaResult['error-codes']);
      return res.status(400).json({ 
        success: false, 
        error: 'reCAPTCHA verification failed. Please try again.',
        errorCodes: recaptchaResult['error-codes']
      });
    }

    // Validate name fields
    if (firstName.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name must be at least 2 characters' 
      });
    }

    if (lastName.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Last name must be at least 2 characters' 
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters' 
      });
    }

    // Check password complexity
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Create auth user in Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ 
        success: false, 
        error: authError.message 
      });
    }

    // Create user profile with admin flags
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        student_number: null,
        course_year: null,
        created_by_admin: true,
        account_verified: true,
        verification_method: 'admin_secret_code'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      
      // Cleanup: delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user profile' 
      });
    }

    // Update admin secret code usage
    await supabase
      .from('admin_secret_codes')
      .update({
        current_uses: codeData.current_uses + 1,
        used_by: authData.user.id,
        used_at: new Date().toISOString()
      })
      .eq('id', codeData.id);

    // Log authentication event
    await supabase.from('auth_audit_log').insert({
      user_id: authData.user.id,
      action: 'admin_signup',
      success: true,
      metadata: {
        role: role,
        secret_code_used: codeData.id
      }
    });

    res.json({ 
      success: true, 
      message: 'Admin account created successfully! You can now sign in.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName,
        role: role
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred during signup. Please try again.' 
    });
  }
});

// POST /api/auth/verify-recaptcha - Standalone reCAPTCHA verification endpoint
router.post('/verify-recaptcha', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ 
        success: false, 
        error: 'reCAPTCHA token is required' 
      });
    }

    const result = await verifyRecaptcha(token);

    res.json({ 
      success: result.success,
      message: result.success ? 'reCAPTCHA verified' : 'reCAPTCHA verification failed',
      errorCodes: result['error-codes']
    });

  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Verification failed' 
    });
  }
});

// POST /api/auth/signup-student - Student signup with face verification
router.post('/signup-student', async (req, res) => {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      studentNumber, 
      courseYear,
      recaptchaToken,
      faceVerification // { verified: boolean, similarity: number }
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !studentNumber || !courseYear) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Validate face verification data
    if (!faceVerification || typeof faceVerification.verified !== 'boolean' || typeof faceVerification.similarity !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'Face verification data is required' 
      });
    }

    // Validate reCAPTCHA
    if (!recaptchaToken) {
      return res.status(400).json({ 
        success: false, 
        error: 'Please complete the reCAPTCHA verification' 
      });
    }

    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: 'reCAPTCHA verification failed' 
      });
    }

    // Validate name fields
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name must be at least 2 characters' 
      });
    }

    // Validate password
    if (password.length < 8) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 8 characters' 
      });
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must contain uppercase, lowercase, number, and special character' 
      });
    }

    // Determine account status based on face verification
    const similarity = faceVerification.similarity;
    const isAutoApproved = faceVerification.verified && similarity >= 90;
    
    let verificationStatus = 'pending_review';
    let accountEnabled = false;

    if (isAutoApproved) {
      verificationStatus = 'auto_approved';
      accountEnabled = true;
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ 
        success: false, 
        error: authError.message 
      });
    }

    // Create user profile with face verification data
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: 'student',
        student_number: studentNumber.trim(),
        course_year: courseYear,
        face_verified: faceVerification.verified,
        face_similarity: similarity,
        verification_status: verificationStatus,
        account_enabled: accountEnabled,
        created_by_admin: false,
        account_verified: isAutoApproved,
        verification_method: 'face_verification'
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to create user profile' 
      });
    }

    // Log authentication event
    await supabase.from('auth_audit_log').insert({
      user_id: authData.user.id,
      action: 'student_signup_with_face_verification',
      success: true,
      metadata: {
        face_verified: faceVerification.verified,
        face_similarity: similarity,
        auto_approved: isAutoApproved,
        verification_status: verificationStatus
      }
    });

    // Send appropriate response
    res.json({ 
      success: true, 
      autoApproved: isAutoApproved,
      similarity: similarity,
      message: isAutoApproved 
        ? 'Account approved! You can login now.' 
        : 'Account pending review. Admin will verify manually.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName,
        role: 'student',
        verificationStatus: verificationStatus
      }
    });

  } catch (error) {
    console.error('Student signup error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred during signup. Please try again.' 
    });
  }
});

module.exports = router;
