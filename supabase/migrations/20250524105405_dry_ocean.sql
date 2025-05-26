-- Create storage buckets for avatars
DO $$
BEGIN
  -- Create the avatars bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, avif_autodetection)
  VALUES ('avatars', 'avatars', TRUE, FALSE)
  ON CONFLICT (id) DO NOTHING;
  
  -- Drop any existing policies to avoid conflicts
  DROP POLICY IF EXISTS "Avatar storage is available to all users" ON storage.objects;
  
  -- Create a policy that enables storage for all users
  CREATE POLICY "Avatar storage is available to all users"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'avatars')
  WITH CHECK (bucket_id = 'avatars');
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error creating storage bucket: %', SQLERRM;
END $$;