/*
  # Fix Collaborative Tables Policies
  
  This migration handles policy fixes for collaboration tables.
  Since the initial tables were already created in a previous migration,
  this one focuses on ensuring policies are properly set up.
*/

-- Drop existing policies before recreating to avoid conflicts
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