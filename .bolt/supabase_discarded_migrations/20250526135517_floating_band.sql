-- Create collaborative_sessions table
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id uuid NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_active timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_id, user_id)
);

-- Create cursor_positions table
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

-- Create edit_operations table
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

-- Add is_collaborative flag to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_collaborative boolean DEFAULT false;

-- Enable RLS on new tables
ALTER TABLE collaborative_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE edit_operations ENABLE ROW LEVEL SECURITY;

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

-- Create function to update last_active in collaborative_sessions
CREATE OR REPLACE FUNCTION update_collaborative_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collaborative_sessions
  SET last_active = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update last_active when cursor position is updated
CREATE TRIGGER update_session_last_active
AFTER INSERT OR UPDATE ON cursor_positions
FOR EACH ROW
EXECUTE FUNCTION update_collaborative_session_last_active();

-- Create function to clean up old sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_collaborative_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM collaborative_sessions
  WHERE last_active < now() - interval '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to periodically clean up old sessions
CREATE TRIGGER cleanup_old_sessions
AFTER INSERT ON collaborative_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_inactive_collaborative_sessions();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS collaborative_sessions_project_id_idx ON collaborative_sessions(project_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_file_id_idx ON collaborative_sessions(file_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_user_id_idx ON collaborative_sessions(user_id);
CREATE INDEX IF NOT EXISTS cursor_positions_session_id_idx ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS edit_operations_project_id_idx ON edit_operations(project_id);
CREATE INDEX IF NOT EXISTS edit_operations_file_id_idx ON edit_operations(file_id);
CREATE INDEX IF NOT EXISTS edit_operations_user_id_idx ON edit_operations(user_id);
CREATE INDEX IF NOT EXISTS edit_operations_timestamp_idx ON edit_operations("timestamp");