/*
  # Create avatars storage bucket

  1. Create a public storage bucket for avatar images
  2. Set proper bucket policies for public access
*/

-- Create the avatars bucket if it doesn't exist
SELECT CASE WHEN NOT EXISTS (
  SELECT FROM storage.buckets WHERE name = 'avatars'
) THEN
  storage.create_bucket('avatars'::text, {public: true}::jsonb)
END;

-- Update the policy to allow public access to avatars
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, false, 52428800, '{image/jpeg,image/png,image/gif,image/webp}')
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 52428800,
    allowed_mime_types = '{image/jpeg,image/png,image/gif,image/webp}';

-- Create policy to allow authenticated users to upload avatars
BEGIN;
  DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
  
  CREATE POLICY "Avatar upload policy" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      auth.uid() = SUBSTRING(name, 1, POSITION('-' IN name) - 1)::uuid
    );
END;

-- Create policy to allow public access to read avatar files
BEGIN;
  DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;
  
  CREATE POLICY "Avatar public read policy" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
END;