/*
# Setup avatars storage bucket

1. Storage Setup
  - Creates the 'avatars' bucket with public read access
  - Sets file size limit and allowed MIME types
  - Adds appropriate security policies

2. Security Policies
  - Allows authenticated users to upload their own avatars
  - Allows public read access to all avatars
*/

-- Create the avatars bucket if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'avatars') THEN
    PERFORM storage.create_bucket('avatars'::text, '{"public": true}'::jsonb);
  END IF;
END $$;

-- Update the bucket configuration if it already exists
UPDATE storage.buckets 
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp}'
WHERE name = 'avatars';

-- Create policy to allow authenticated users to upload avatars
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;

CREATE POLICY "Avatar upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = SUBSTRING(name, 1, POSITION('-' IN name) - 1)::uuid
  );

-- Create policy to allow public access to read avatar files
DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;

CREATE POLICY "Avatar public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');