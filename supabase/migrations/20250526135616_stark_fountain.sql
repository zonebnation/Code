/*
# Fix Collaborative Tables Migration

This migration file has been modified to:
1. Use DROP POLICY IF EXISTS before creating policies
2. Check for existing objects where needed
3. Maintain the same functionality while avoiding duplicate object errors
*/

-- Create collaborative_sessions table if not exists
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_id, user_id)
);

-- Create cursor_positions table if not exists
CREATE TABLE IF NOT EXISTS cursor_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  "line" integer NOT NULL,
  "column" integer NOT NULL,
  selection_start_line integer,
  selection_start_column integer,
  selection_end_line integer,
  selection_end_column integer,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create edit_operations table if not exists
CREATE TABLE IF NOT EXISTS edit_operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type text NOT NULL CHECK (operation_type IN ('insert', 'delete', 'replace')),
  position_line integer NOT NULL,
  position_column integer NOT NULL,
  text text,
  length integer,
  timestamp bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add is_collaborative flag to projects if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'is_collaborative'
    ) THEN
        ALTER TABLE projects ADD COLUMN is_collaborative boolean DEFAULT false;
    END IF;
END$$;

-- Enable RLS on tables if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'collaborative_sessions' AND rowsecurity = true
    ) THEN
        ALTER TABLE collaborative_sessions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'cursor_positions' AND rowsecurity = true
    ) THEN
        ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'edit_operations' AND rowsecurity = true
    ) THEN
        ALTER TABLE edit_operations ENABLE ROW LEVEL SECURITY;
    END IF;
END$$;

-- Drop existing policies before recreating
DROP POLICY IF EXISTS "Users can view collaborative sessions for their projects or whe" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can create collaborative sessions for projects they can a" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can update their own collaborative sessions" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can delete their own collaborative sessions" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can view cursor positions for sessions they can access" ON cursor_positions;
DROP POLICY IF EXISTS "Users can create cursor positions for their own sessions" ON cursor_positions;
DROP POLICY IF EXISTS "Users can update their own cursor positions" ON cursor_positions;
DROP POLICY IF EXISTS "Users can delete their own cursor positions" ON cursor_positions;
DROP POLICY IF EXISTS "Users can view edit operations for projects they can access" ON edit_operations;
DROP POLICY IF EXISTS "Users can create edit operations for projects they can edit" ON edit_operations;

-- Create policies for collaborative_sessions
CREATE POLICY "Users can view collaborative sessions for their projects or where they are collaborators"
  ON collaborative_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborative_sessions.project_id
      AND (
        projects.user_id = auth.uid()
        OR projects.is_public = true
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create collaborative sessions for projects they can access"
  ON collaborative_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = collaborative_sessions.project_id
      AND (
        projects.user_id = auth.uid()
        OR projects.is_public = true
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
    AND auth.uid() = collaborative_sessions.user_id
  );

CREATE POLICY "Users can update their own collaborative sessions"
  ON collaborative_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = collaborative_sessions.user_id);

CREATE POLICY "Users can delete their own collaborative sessions"
  ON collaborative_sessions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = collaborative_sessions.user_id);

-- Create policies for cursor_positions
CREATE POLICY "Users can view cursor positions for sessions they can access"
  ON cursor_positions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborative_sessions
      WHERE collaborative_sessions.id = cursor_positions.session_id
      AND EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = collaborative_sessions.project_id
        AND (
          projects.user_id = auth.uid()
          OR projects.is_public = true
          OR EXISTS (
            SELECT 1 FROM project_collaborators
            WHERE project_collaborators.project_id = projects.id
            AND project_collaborators.user_id = auth.uid()
          )
        )
      )
    )
  );

CREATE POLICY "Users can create cursor positions for their own sessions"
  ON cursor_positions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborative_sessions
      WHERE collaborative_sessions.id = cursor_positions.session_id
      AND collaborative_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own cursor positions"
  ON cursor_positions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborative_sessions
      WHERE collaborative_sessions.id = cursor_positions.session_id
      AND collaborative_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own cursor positions"
  ON cursor_positions
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collaborative_sessions
      WHERE collaborative_sessions.id = cursor_positions.session_id
      AND collaborative_sessions.user_id = auth.uid()
    )
  );

-- Create policies for edit_operations
CREATE POLICY "Users can view edit operations for projects they can access"
  ON edit_operations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = edit_operations.project_id
      AND (
        projects.user_id = auth.uid()
        OR projects.is_public = true
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can create edit operations for projects they can edit"
  ON edit_operations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = edit_operations.project_id
      AND (
        projects.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_collaborators
          WHERE project_collaborators.project_id = projects.id
          AND project_collaborators.user_id = auth.uid()
          AND project_collaborators.permission IN ('write', 'admin')
        )
      )
    )
    AND auth.uid() = edit_operations.user_id
  );

-- Create functions and triggers if they don't already exist
DO $$
BEGIN
    -- Create function to update last_active in collaborative_sessions
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'update_collaborative_session_last_active'
    ) THEN
        CREATE OR REPLACE FUNCTION update_collaborative_session_last_active()
        RETURNS TRIGGER AS $$
        BEGIN
          UPDATE collaborative_sessions
          SET last_active = now()
          WHERE id = NEW.session_id;
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
    
    -- Create function to clean up old sessions
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'cleanup_inactive_collaborative_sessions'
    ) THEN
        CREATE OR REPLACE FUNCTION cleanup_inactive_collaborative_sessions()
        RETURNS TRIGGER AS $$
        BEGIN
          DELETE FROM collaborative_sessions
          WHERE last_active < now() - interval '1 hour';
          RETURN NULL;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END$$;

-- Create triggers if they don't already exist
DO $$
BEGIN
    -- Check for update_session_last_active trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_session_last_active'
    ) THEN
        CREATE TRIGGER update_session_last_active
        AFTER INSERT OR UPDATE ON cursor_positions
        FOR EACH ROW
        EXECUTE FUNCTION update_collaborative_session_last_active();
    END IF;
    
    -- Check for cleanup_old_sessions trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'cleanup_old_sessions'
    ) THEN
        CREATE TRIGGER cleanup_old_sessions
        AFTER INSERT ON collaborative_sessions
        FOR EACH STATEMENT
        EXECUTE FUNCTION cleanup_inactive_collaborative_sessions();
    END IF;
END$$;

-- Create indexes if they don't already exist
CREATE INDEX IF NOT EXISTS collaborative_sessions_project_id_idx ON collaborative_sessions(project_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_file_id_idx ON collaborative_sessions(file_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_user_id_idx ON collaborative_sessions(user_id);
CREATE INDEX IF NOT EXISTS cursor_positions_session_id_idx ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS edit_operations_project_id_idx ON edit_operations(project_id);
CREATE INDEX IF NOT EXISTS edit_operations_file_id_idx ON edit_operations(file_id);
CREATE INDEX IF NOT EXISTS edit_operations_user_id_idx ON edit_operations(user_id);
CREATE INDEX IF NOT EXISTS edit_operations_timestamp_idx ON edit_operations("timestamp");