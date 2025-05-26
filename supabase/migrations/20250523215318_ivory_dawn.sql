/*
  # User Projects Schema
  
  1. New Tables
    - `projects`: Stores user projects with metadata
      - `id` (uuid, primary key): Unique identifier for the project
      - `name` (text): Name of the project
      - `description` (text): Optional project description
      - `user_id` (uuid): Foreign key to profiles table
      - `is_public` (boolean): Whether project is publicly viewable
      - `created_at` (timestamptz): When project was created
      - `updated_at` (timestamptz): When project was last updated
    
    - `project_files`: Stores files within projects
      - `id` (uuid, primary key): Unique identifier for the file
      - `project_id` (uuid): Foreign key to projects table
      - `name` (text): File name
      - `path` (text): File path within project
      - `content` (text): File content
      - `type` (text): 'file' or 'directory'
      - `parent_id` (uuid): Parent directory id (null for root files)
      - `created_at` (timestamptz): When file was created
      - `updated_at` (timestamptz): When file was last updated
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Project files table
CREATE TABLE IF NOT EXISTS project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
  parent_id UUID REFERENCES project_files(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, path)
);

-- Enable RLS on project_files table
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX project_files_project_id_idx ON project_files(project_id);
CREATE INDEX project_files_parent_id_idx ON project_files(parent_id);
CREATE INDEX projects_user_id_idx ON projects(user_id);

-- Security policies for projects

-- Read access: Owner or public projects
CREATE POLICY "Users can read own projects" 
  ON projects 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid() OR is_public = true);

-- Insert access: Only the authenticated user for their own projects
CREATE POLICY "Users can create own projects" 
  ON projects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Update access: Only the owner can update their projects
CREATE POLICY "Users can update own projects" 
  ON projects 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Delete access: Only the owner can delete their projects
CREATE POLICY "Users can delete own projects" 
  ON projects 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Security policies for project_files

-- Read access: Can read files from owned projects or public projects
CREATE POLICY "Users can read files from owned or public projects" 
  ON project_files 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (projects.user_id = auth.uid() OR projects.is_public = true)
    )
  );

-- Insert access: Can add files to owned projects
CREATE POLICY "Users can add files to owned projects" 
  ON project_files 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update access: Can update files in owned projects
CREATE POLICY "Users can update files in owned projects" 
  ON project_files 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Delete access: Can delete files from owned projects
CREATE POLICY "Users can delete files from owned projects" 
  ON project_files 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER set_timestamp_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_project_files
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();