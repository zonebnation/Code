/*
  # Fix Infinite Recursion in Project Collaborators Policy
  
  This migration addresses the infinite recursion error in the project_collaborators policies
  by simplifying the policy conditions and avoiding circular references.
*/

-- Drop problematic policies that are causing infinite recursion
DROP POLICY IF EXISTS "Project owners and collaborators can view collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can add collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners and admins can update collaborators" ON project_collaborators;
DROP POLICY IF EXISTS "Project owners, admins, or self can remove collaborators" ON project_collaborators;

-- Create simplified policies that avoid circular references

-- Read access: Project owner or the user themselves can see collaborator entries
CREATE POLICY "Simple view collaborators policy" 
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
CREATE POLICY "Simple add collaborators policy" 
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
CREATE POLICY "Simple update collaborators policy" 
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
CREATE POLICY "Simple remove collaborators policy" 
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