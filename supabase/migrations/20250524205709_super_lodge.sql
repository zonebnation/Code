/*
  # Create shared_entities table

  1. New Tables
    - `shared_entities` - Stores shared files and projects information
    
  2. Security
    - Enable RLS on the table
    - Add policies for proper access control
*/

-- Create shared_entities table
CREATE TABLE IF NOT EXISTS shared_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id uuid NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('file', 'project')),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type text NOT NULL CHECK (share_type IN ('public', 'private', 'link')),
  password text,
  expires_at timestamptz,
  allow_download boolean NOT NULL DEFAULT true,
  allow_copy boolean NOT NULL DEFAULT true,
  access_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS shared_entities_entity_id_idx ON shared_entities(entity_id);
CREATE INDEX IF NOT EXISTS shared_entities_user_id_idx ON shared_entities(user_id);
CREATE INDEX IF NOT EXISTS shared_entities_entity_type_idx ON shared_entities(entity_type);
CREATE INDEX IF NOT EXISTS shared_entities_share_type_idx ON shared_entities(share_type);

-- Trigger for updated_at
CREATE TRIGGER set_timestamp_shared_entities
BEFORE UPDATE ON shared_entities
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Enable Row Level Security
ALTER TABLE shared_entities ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can read their own shared entities
CREATE POLICY "Users can read their own shared entities"
  ON shared_entities
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create shared entities
CREATE POLICY "Users can create shared entities"
  ON shared_entities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own shared entities
CREATE POLICY "Users can update their own shared entities"
  ON shared_entities
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own shared entities
CREATE POLICY "Users can delete their own shared entities"
  ON shared_entities
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can read public shared entities
CREATE POLICY "Anyone can read public shared entities"
  ON shared_entities
  FOR SELECT
  TO anon
  USING (share_type = 'public');

-- Create shared_files bucket in storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared_files', 'shared_files', true);

-- Enable public access to shared_files bucket
CREATE POLICY "Public access to shared files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'shared_files');

-- Allow authenticated users to upload to shared_files bucket
CREATE POLICY "Authenticated users can upload shared files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shared_files');

-- Allow owners to delete their shared files
CREATE POLICY "Users can delete their shared files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'shared_files' AND owner = auth.uid());