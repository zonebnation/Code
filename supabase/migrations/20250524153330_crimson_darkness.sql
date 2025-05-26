/*
  # Add Project Chat Functionality

  1. New Tables
    - `project_messages`
      - `id` (uuid, primary key)
      - `project_id` (uuid, reference to projects)
      - `user_id` (uuid, reference to profiles)
      - `content` (text)
      - `created_at` (timestamp with time zone)
  2. Security
    - Enable RLS on `project_messages` table
    - Add policy for collaborative chat
*/

-- Create table for project chat messages
CREATE TABLE IF NOT EXISTS project_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better query performance
CREATE INDEX project_messages_project_id_idx ON project_messages(project_id);
CREATE INDEX project_messages_user_id_idx ON project_messages(user_id);
CREATE INDEX project_messages_created_at_idx ON project_messages(created_at);

-- Enable Row Level Security
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- Add policy for reading messages (project owners and collaborators can view messages)
CREATE POLICY "Project owners and collaborators can read messages"
  ON project_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_messages.project_id
      AND (
        projects.user_id = auth.uid()
        OR projects.is_public = true
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = project_messages.project_id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  );

-- Add policy for creating messages (project owners and collaborators can add messages)
CREATE POLICY "Project owners and collaborators can add messages"
  ON project_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_messages.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = project_messages.project_id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- Add policy for deleting own messages
CREATE POLICY "Users can delete own messages"
  ON project_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add notification trigger for new messages
CREATE OR REPLACE FUNCTION notify_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Get project owner
  INSERT INTO notifications (user_id, sender_id, type, content, reference_id, reference_type)
  SELECT 
    projects.user_id,  -- recipient (project owner)
    NEW.user_id,       -- sender
    'message',         -- notification type
    (SELECT username FROM profiles WHERE id = NEW.user_id) || ' sent a message in ' || projects.name,
    NEW.id,            -- message id as reference
    'message'          -- reference type
  FROM projects
  WHERE projects.id = NEW.project_id
  AND projects.user_id != NEW.user_id;  -- Don't notify yourself
  
  -- Notify all collaborators except the message sender
  INSERT INTO notifications (user_id, sender_id, type, content, reference_id, reference_type)
  SELECT 
    project_collaborators.user_id,  -- recipient (collaborator)
    NEW.user_id,                    -- sender
    'message',                      -- notification type
    (SELECT username FROM profiles WHERE id = NEW.user_id) || ' sent a message in ' || projects.name,
    NEW.id,                         -- message id as reference
    'message'                       -- reference type
  FROM project_collaborators
  JOIN projects ON projects.id = project_collaborators.project_id
  WHERE project_collaborators.project_id = NEW.project_id
  AND project_collaborators.user_id != NEW.user_id;  -- Don't notify yourself
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_message_insert
AFTER INSERT ON project_messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_message();