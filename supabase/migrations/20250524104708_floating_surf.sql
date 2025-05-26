-- Create storage buckets if they don't exist already
-- Ensures the avatars bucket exists for profile pictures

DO $$
BEGIN
  -- Create the avatars bucket if it doesn't exist
  -- This uses the built-in Supabase storage bucket creation function
  INSERT INTO storage.buckets (id, name, public, avif_autodetection)
  VALUES ('avatars', 'avatars', TRUE, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  -- Create a policy that enables storage for all users
  INSERT INTO storage.policies (name, definition, bucket_id)
  VALUES 
    ('Avatar Policy', '(bucket_id = ''avatars''::text AND (storage.foldername(name))[1] = auth.uid()::text)', 'avatars')
  ON CONFLICT DO NOTHING;
  
  -- Grant all privileges on the avatars bucket to authenticated users
  CREATE POLICY "Allow authenticated users to use avatars bucket"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error creating storage bucket: %', SQLERRM;
END $$;