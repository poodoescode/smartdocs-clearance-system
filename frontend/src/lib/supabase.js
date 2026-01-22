// ============================================
// SINGLE SUPABASE CLIENT INSTANCE
// ============================================
// This file creates ONE Supabase client that is shared across the entire app.
// NEVER create another client with createClient() elsewhere!
// Always import from this file: import { supabase } from '@/lib/supabase'

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Create single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export for debugging (remove in production)
if (import.meta.env.DEV) {
  console.log('✅ Supabase client initialized');
}
