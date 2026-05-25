-- ============================================================
-- Supabase Storage Setup for Complaint Images
-- Run this in Supabase SQL Editor to enable image uploads
-- ============================================================

-- 1. Create a public storage bucket named 'complaints'
-- This bucket will store all the images uploaded by citizens as proof
INSERT INTO storage.buckets (id, name, public)
VALUES ('complaints', 'complaints', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to prevent conflict errors
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

-- 3. Create Policy: Allow anyone (anonymous citizens, admins, lurah) to view/read images
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'complaints');

-- 4. Create Policy: Allow anyone (anonymous citizens) to upload/insert images
CREATE POLICY "Allow public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'complaints');

-- 5. Create Policy: Allow anyone to update/overwrite files in complaints bucket
CREATE POLICY "Allow public update access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'complaints')
WITH CHECK (bucket_id = 'complaints');

-- 6. Create Policy: Allow anyone to delete files from complaints bucket (optional, for cleanup)
CREATE POLICY "Allow public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'complaints');
