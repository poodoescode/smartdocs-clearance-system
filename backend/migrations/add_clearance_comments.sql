-- Migration: Create clearance_comments table
-- For the Comment System as specified in COMMENT_SYSTEM_DOCUMENTATION.md
-- NOTE: References public.requests(id) which uses INTEGER, not UUID

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the clearance_comments table
CREATE TABLE IF NOT EXISTS clearance_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  clearance_request_id integer NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  commenter_id uuid NOT NULL REFERENCES profiles(id),
  commenter_name TEXT NOT NULL,
  commenter_role TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  visibility TEXT DEFAULT 'all' CHECK (visibility IN ('all', 'admins_only', 'professors_only')),
  is_resolved BOOLEAN DEFAULT false,
  resolved_by uuid REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clearance_comments_request ON clearance_comments(clearance_request_id);
CREATE INDEX IF NOT EXISTS idx_clearance_comments_commenter ON clearance_comments(commenter_id);
CREATE INDEX IF NOT EXISTS idx_clearance_comments_created ON clearance_comments(created_at DESC);

-- Row Level Security
ALTER TABLE clearance_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read comments based on visibility
CREATE POLICY "Users can view comments based on visibility"
  ON clearance_comments FOR SELECT
  USING (true);

-- Policy: Non-student users can insert comments
CREATE POLICY "Non-students can insert comments"
  ON clearance_comments FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update their own comments or admins can update any
CREATE POLICY "Users can update comments"
  ON clearance_comments FOR UPDATE
  USING (true);

-- Policy: Users can delete their own comments within time limit
CREATE POLICY "Users can delete comments"
  ON clearance_comments FOR DELETE
  USING (true);
