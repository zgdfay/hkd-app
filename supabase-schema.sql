-- Add is_forwarded column to track if admin has forwarded to lurah
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false;

-- Add lurah_status column for lurah internal tracking
DO $$ BEGIN
  CREATE TYPE lurah_work_status AS ENUM ('pending', 'processing', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS lurah_status lurah_work_status DEFAULT 'pending';

-- Notifications table for storing push notification records
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push tokens table for storing FCM device tokens
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_info JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Select policy - anyone can view their own notifications
DROP POLICY IF EXISTS "Anyone can view own notifications" ON public.notifications;
CREATE POLICY "Anyone can view own notifications"
ON public.notifications FOR SELECT
USING (auth.uid() = user_id);

-- Anyone can insert notifications
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.notifications;
CREATE POLICY "Anyone can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Users can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Push tokens policies
DROP POLICY IF EXISTS "Anyone can view own push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can view own push tokens"
ON public.push_tokens FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can insert push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can insert push tokens"
ON public.push_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can update push tokens" ON public.push_tokens;
CREATE POLICY "Anyone can update push tokens"
ON public.push_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate

-- Select policy - anyone can view
DROP POLICY IF EXISTS "Anyone can view complaints" ON public.complaints;
CREATE POLICY "Anyone can view complaints"
ON public.complaints FOR SELECT
USING (true);

-- Admin can update is_forwarded
DROP POLICY IF EXISTS "Admin can update forwarded status" ON public.complaints;
CREATE POLICY "Admin can update forwarded status"
ON public.complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Lurah can update lurah_status
DROP POLICY IF EXISTS "Lurah can update lurah status" ON public.complaints;
CREATE POLICY "Lurah can update lurah status"
ON public.complaints FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'lurah'
  )
);

-- Anyone can update status (for final status update to Selesai)
DROP POLICY IF EXISTS "Anyone can update status" ON public.complaints;
CREATE POLICY "Anyone can update status"
ON public.complaints FOR UPDATE
USING (true);

-- Add reporter_push_token for anonymous warga push notifications
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS reporter_push_token TEXT;

-- Enable Supabase Realtime on complaints and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;