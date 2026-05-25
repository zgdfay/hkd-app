-- ============================================================
-- Push Tokens Table for Expo Push Notifications
-- Run this in Supabase SQL Editor BEFORE building the app
-- ============================================================

-- Table to store Expo Push Tokens per device
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- The Expo Push Token (e.g., ExponentPushToken[xxx])
  expo_push_token TEXT NOT NULL,
  
  -- For logged-in users (admin/lurah)
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- For anonymous citizens tracking a complaint
  complaint_code TEXT,
  
  -- Role: 'admin' | 'lurah' | 'citizen'
  role TEXT NOT NULL DEFAULT 'citizen',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unique constraints to prevent duplicate tokens
-- One device token per user (for admin/lurah)
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token_user 
  ON public.push_tokens(expo_push_token, user_id) 
  WHERE user_id IS NOT NULL;

-- One device token per complaint (for citizens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_push_tokens_token_complaint 
  ON public.push_tokens(expo_push_token, complaint_code) 
  WHERE complaint_code IS NOT NULL;

-- Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_push_tokens_role ON public.push_tokens(role);
CREATE INDEX IF NOT EXISTS idx_push_tokens_complaint_code ON public.push_tokens(complaint_code);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
-- Anyone can insert (citizens are anonymous, no auth)
DROP POLICY IF EXISTS "Anyone can insert push token" ON public.push_tokens;
CREATE POLICY "Anyone can insert push token"
ON public.push_tokens FOR INSERT WITH CHECK (true);

-- Anyone can read (needed to look up tokens for sending push)
DROP POLICY IF EXISTS "Anyone can read push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can read push tokens"
ON public.push_tokens FOR SELECT USING (true);

-- Anyone can update (for upsert to work)
DROP POLICY IF EXISTS "Anyone can update push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can update push tokens"
ON public.push_tokens FOR UPDATE USING (true);

-- Anyone can delete their own token
DROP POLICY IF EXISTS "Anyone can delete push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can delete push tokens"
ON public.push_tokens FOR DELETE USING (true);
