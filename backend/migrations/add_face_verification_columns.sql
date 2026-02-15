-- Add face verification columns to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS face_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS face_similarity FLOAT,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS account_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.face_verified IS 'Whether face verification was successful';
COMMENT ON COLUMN profiles.face_similarity IS 'Face similarity percentage (0-100)';
COMMENT ON COLUMN profiles.verification_status IS 'Status: auto_approved, pending_review, rejected';
COMMENT ON COLUMN profiles.account_enabled IS 'Whether account can login';
COMMENT ON COLUMN profiles.rejection_reason IS 'Reason if account was rejected';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_profiles_account_enabled ON profiles(account_enabled);

-- Update existing admin accounts to be enabled
UPDATE profiles 
SET account_enabled = TRUE, 
    verification_status = 'auto_approved'
WHERE role IN ('library_admin', 'cashier_admin', 'registrar_admin', 'super_admin')
AND account_enabled IS NULL;

SELECT 'Face verification columns added successfully!' AS message;
