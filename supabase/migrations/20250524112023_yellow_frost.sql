/*
  # Create Avatars Storage Bucket
  
  1. Creates a storage bucket for user avatars
  2. Sets up public access policies
  3. Ensures avatar storage is accessible to authenticated users
*/

-- Create avatars bucket if it doesn't exist
DO $$
BEGIN
  -- Create the avatars bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, avif_autodetection)
  VALUES ('avatars', 'avatars', TRUE, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  -- Make sure public access is enabled for the avatars bucket
  UPDATE storage.buckets
  SET public = TRUE
  WHERE id = 'avatars';
  
  -- Drop any existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Avatar storage is available to authenticated users" ON storage.objects;
  
  -- Create a policy that enables storage for all authenticated users
  CREATE POLICY "Avatar storage is available to authenticated users"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error creating storage bucket: %', SQLERRM;
END $$;