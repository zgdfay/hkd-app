-- Add is_forwarded column to track if admin has forwarded to lurah
ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS is_forwarded BOOLEAN DEFAULT false;

-- Add lurah_status column for lurah internal tracking
DO $$ BEGIN
  CREATE TYPE lurah_work_status AS ENUM ('pending', 'processing', 'done');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE public.complaints ADD COLUMN IF NOT EXISTS lurah_status lurah_work_status DEFAULT 'pending';

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