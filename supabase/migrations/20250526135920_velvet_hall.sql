/*
  # Collaborative Editing Triggers and Functions
  
  This migration creates functions and triggers for the collaboration system
  to handle session management and cleanup.
*/

-- Add is_collaborative flag to projects if not exists
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_collaborative boolean DEFAULT false;

-- Create or replace function to update last_active in collaborative_sessions
CREATE OR REPLACE FUNCTION update_collaborative_session_last_active()
RETURNS TRIGGER AS $func$
BEGIN
  UPDATE collaborative_sessions
  SET last_active = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS update_session_last_active ON cursor_positions;

-- Create trigger to update last_active when cursor position is updated
CREATE TRIGGER update_session_last_active
AFTER INSERT OR UPDATE ON cursor_positions
FOR EACH ROW
EXECUTE FUNCTION update_collaborative_session_last_active();

-- Create or replace function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_collaborative_sessions()
RETURNS TRIGGER AS $func$
BEGIN
  DELETE FROM collaborative_sessions
  WHERE last_active < now() - interval '1 hour';
  RETURN NULL;
END;
$func$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors
DROP TRIGGER IF EXISTS cleanup_old_sessions ON collaborative_sessions;

-- Create trigger to periodically clean up old sessions
CREATE TRIGGER cleanup_old_sessions
AFTER INSERT ON collaborative_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_inactive_collaborative_sessions();

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS collaborative_sessions_project_id_idx ON collaborative_sessions(project_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_file_id_idx ON collaborative_sessions(file_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_user_id_idx ON collaborative_sessions(user_id);
CREATE INDEX IF NOT EXISTS cursor_positions_session_id_idx ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS edit_operations_project_id_idx ON edit_operations(project_id);
CREATE INDEX IF NOT EXISTS edit_operations_file_id_idx ON edit_operations(file_id);
CREATE INDEX IF NOT EXISTS edit_operations_user_id_idx ON edit_operations(user_id);
CREATE INDEX IF NOT EXISTS edit_operations_timestamp_idx ON edit_operations("timestamp");