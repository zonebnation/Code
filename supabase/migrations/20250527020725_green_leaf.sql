/*
  # Create Storage Buckets
  
  This migration creates storage buckets for the application
  and sets up appropriate policies for each bucket.
  
  1. Buckets
    - avatars: For user profile pictures
    - videos: For video content
    - shared_files: For shared project files
    
  2. Policies
    - Public read access where appropriate
    - Authenticated write access with proper constraints
*/

-- Create the avatars bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, 2097152, '{image/jpeg,image/png,image/gif,image/webp}');
  END IF;
END $$;

-- Create policy to allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
CREATE POLICY "Avatar upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid()::text = SPLIT_PART(name, '-', 1))
  );

-- Create policy to allow public access to read avatar files
DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;
CREATE POLICY "Avatar public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Create the videos bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'videos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('videos', 'videos', true, 104857600, '{video/mp4,video/webm,video/ogg,video/quicktime,application/mp4}');
  END IF;
END $$;

-- Create policy to allow authenticated users to upload videos
DROP POLICY IF EXISTS "Videos upload policy" ON storage.objects;
CREATE POLICY "Videos upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1))
  );

-- Create policy to allow public access to read videos
DROP POLICY IF EXISTS "Videos public read policy" ON storage.objects;
CREATE POLICY "Videos public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'videos');

-- Create policy to allow users to delete their own videos
DROP POLICY IF EXISTS "Videos delete policy" ON storage.objects;
CREATE POLICY "Videos delete policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1))
  );

-- Create the shared_files bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'shared_files') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('shared_files', 'shared_files', true, 52428800);
  END IF;
END $$;

-- Create policy to allow authenticated users to upload shared files
DROP POLICY IF EXISTS "Shared files upload policy" ON storage.objects;
CREATE POLICY "Shared files upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shared_files');

-- Create policy to allow public access to read shared files
DROP POLICY IF EXISTS "Shared files public read policy" ON storage.objects;
CREATE POLICY "Shared files public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'shared_files');

-- Create policy to allow users to delete their own shared files
DROP POLICY IF EXISTS "Shared files delete policy" ON storage.objects;
CREATE POLICY "Shared files delete policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shared_files' AND
    owner = auth.uid()
  );