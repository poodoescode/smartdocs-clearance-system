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
      recaptchaToken 
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
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

    // Validate student-specific fields
    if (role === 'student') {
      if (!studentNumber || !courseYear) {
        return res.status(400).json({ 
          success: false, 
          error: 'Student number and course/year are required for students' 
        });
      }
    }

    // Create auth user in Supabase
    // NOTE: Email verification has been intentionally disabled
    // Users can login immediately after signup
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm email (no verification required)
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return res.status(400).json({ 
        success: false, 
        error: authError.message 
      });
    }

    // Create user profile
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        role: role,
        student_number: role === 'student' ? studentNumber : null,
        course_year: role === 'student' ? courseYear : null
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

    res.json({ 
      success: true, 
      message: 'Account created successfully! You can now sign in.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        fullName: fullName
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

module.exports = router;
