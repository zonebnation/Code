/*
  # Settings synchronization

  1. New Tables
    - `user_settings`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `key` (text)
      - `value` (jsonb)
      - `updated_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_settings`
    - Add policies for authenticated users to manage their own settings
*/

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create a composite unique constraint on user_id and key
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_key_idx ON user_settings (user_id, key);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create trigger for updating timestamps
CREATE TRIGGER set_timestamp_user_settings
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create policies
-- Users can read their own settings
CREATE POLICY "Users can read their own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own settings
CREATE POLICY "Users can insert their own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own settings
CREATE POLICY "Users can update their own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own settings
CREATE POLICY "Users can delete their own settings"
  ON user_settings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());