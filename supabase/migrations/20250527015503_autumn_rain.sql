/*
  # Fix Recursive Policies for Project Collaborators
  
  This migration fixes the infinite recursion issue in the project_collaborators policies
  by replacing them with simpler policies that avoid circular references.
*/

-- Drop all existing policies for project_collaborators to start fresh
DROP POLICY IF EXISTS "ProjectCollaboratorsDeletePolicy_v2" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsInsertPolicy_v2" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsUpdatePolicy_v2" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsViewPolicy_v2" ON project_collaborators;

DROP POLICY IF EXISTS "Project owners and collaborators can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners, admins, or self can remove collaborators" ON project_collaborators;

DROP POLICY IF EXISTS "Simple view collaborators policy" ON project_collaborators;
DROP POLICY IF EXISTS "Simple add collaborators policy" ON project_collaborators;
DROP POLICY IF EXISTS "Simple update collaborators policy" ON project_collaborators;
DROP POLICY IF EXISTS "Simple remove collaborators policy" ON project_collaborators;

-- Create new simplified policies that avoid circular references

-- Read access: Project owner or the user themselves can see collaborator entries
CREATE POLICY "ProjectCollaboratorsViewPolicy_v3" 
  ON project_collaborators 
  FOR SELECT 
  TO authenticated 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Insert access: Only project owners can add collaborators
CREATE POLICY "ProjectCollaboratorsInsertPolicy_v3" 
  ON project_collaborators 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update access: Only project owners can update collaborators
CREATE POLICY "ProjectCollaboratorsUpdatePolicy_v3" 
  ON project_collaborators 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Delete access: Project owners or the collaborator themselves can remove collaborators
CREATE POLICY "ProjectCollaboratorsDeletePolicy_v3" 
  ON project_collaborators 
  FOR DELETE 
  TO authenticated 
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND projects.user_id = auth.uid()
    )
  );