/*
  # Collaboration Features Schema
  
  1. New Tables
    - `project_collaborators`: Users who can collaborate on projects
      - `id` (uuid, primary key): Unique identifier for the relationship
      - `project_id` (uuid): Project being collaborated on, references projects
      - `user_id` (uuid): Collaborator, references profiles
      - `permission` (text): Permission level (read, write, admin)
      - `created_at` (timestamptz): When the collaboration was created
      - `updated_at` (timestamptz): When the collaboration was last updated
    
    - `collaboration_invites`: Invitations to collaborate on projects
      - `id` (uuid, primary key): Unique identifier for the invitation
      - `project_id` (uuid): Project being shared, references projects
      - `inviter_id` (uuid): User sending the invitation, references profiles
      - `invitee_id` (uuid): User being invited, references profiles
      - `permission` (text): Offered permission level
      - `status` (text): Status of invitation (pending, accepted, rejected)
      - `created_at` (timestamptz): When the invitation was created
      - `updated_at` (timestamptz): When the invitation was last updated
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Add triggers for notifications
*/

-- Project collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_collaborators table
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;

-- Collaboration invites table
CREATE TABLE IF NOT EXISTS collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT NOT NULL CHECK (permission IN ('read', 'write', 'admin')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, invitee_id)
);

-- Enable RLS on collaboration_invites table
ALTER TABLE collaboration_invites ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX project_collaborators_project_id_idx ON project_collaborators(project_id);
CREATE INDEX project_collaborators_user_id_idx ON project_collaborators(user_id);
CREATE INDEX collaboration_invites_project_id_idx ON collaboration_invites(project_id);
CREATE INDEX collaboration_invites_inviter_id_idx ON collaboration_invites(inviter_id);
CREATE INDEX collaboration_invites_invitee_id_idx ON collaboration_invites(invitee_id);
CREATE INDEX collaboration_invites_status_idx ON collaboration_invites(status);

-- Modify the projects table to add a collaborators_can_invite flag
ALTER TABLE projects ADD COLUMN IF NOT EXISTS collaborators_can_invite BOOLEAN DEFAULT false;

-- Security policies for project_collaborators

-- Read access: Project owner or collaborators can see collaborators
CREATE POLICY "Project owners and collaborators can view collaborators" 
  ON project_collaborators 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM project_collaborators pc 
          WHERE pc.project_id = project_collaborators.project_id 
          AND pc.user_id = auth.uid()
        )
      )
    )
  );

-- Insert access: Only project owners or admins can add collaborators
CREATE POLICY "Project owners and admins can add collaborators" 
  ON project_collaborators 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM project_collaborators pc 
          WHERE pc.project_id = project_collaborators.project_id 
          AND pc.user_id = auth.uid()
          AND pc.permission = 'admin'
        )
      )
    )
  );

-- Update access: Only project owners or admins can update collaborators
CREATE POLICY "Project owners and admins can update collaborators" 
  ON project_collaborators 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM project_collaborators pc 
          WHERE pc.project_id = project_collaborators.project_id 
          AND pc.user_id = auth.uid()
          AND pc.permission = 'admin'
        )
      )
    )
  );

-- Delete access: Project owners, admins, or the collaborator themselves can remove collaborators
CREATE POLICY "Project owners, admins, or self can remove collaborators" 
  ON project_collaborators 
  FOR DELETE 
  TO authenticated 
  USING (
    project_collaborators.user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_collaborators.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM project_collaborators pc 
          WHERE pc.project_id = project_collaborators.project_id 
          AND pc.user_id = auth.uid()
          AND pc.permission = 'admin'
        )
      )
    )
  );

-- Security policies for collaboration_invites

-- Read access: Inviter, invitee, and project owners can see invites
CREATE POLICY "Inviters, invitees, and project owners can view invites" 
  ON collaboration_invites 
  FOR SELECT 
  TO authenticated 
  USING (
    inviter_id = auth.uid() OR 
    invitee_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaboration_invites.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Insert access: Only project owners or admin collaborators can create invites
-- (if collaborators_can_invite is true for the project)
CREATE POLICY "Project owners and authorized collaborators can create invites" 
  ON collaboration_invites 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaboration_invites.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        (
          projects.collaborators_can_invite = true AND
          EXISTS (
            SELECT 1 FROM project_collaborators 
            WHERE project_collaborators.project_id = collaboration_invites.project_id 
            AND project_collaborators.user_id = auth.uid()
            AND project_collaborators.permission IN ('write', 'admin')
          )
        )
      )
    )
  );

-- Update access: Inviter can update invite details, invitee can update status
CREATE POLICY "Inviters and invitees can update invites" 
  ON collaboration_invites 
  FOR UPDATE 
  TO authenticated 
  USING (inviter_id = auth.uid() OR invitee_id = auth.uid());

-- Delete access: Inviter and project owner can delete invites
CREATE POLICY "Inviters and project owners can delete invites" 
  ON collaboration_invites 
  FOR DELETE 
  TO authenticated 
  USING (
    inviter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = collaboration_invites.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- Update the project RLS policies to account for collaborators
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
CREATE POLICY "Users can read own or collaborative projects" 
  ON projects 
  FOR SELECT 
  TO authenticated 
  USING (
    user_id = auth.uid() OR 
    is_public = true OR
    EXISTS (
      SELECT 1 FROM project_collaborators 
      WHERE project_collaborators.project_id = projects.id 
      AND project_collaborators.user_id = auth.uid()
    )
  );

-- Update project_files RLS policies to account for collaborators
DROP POLICY IF EXISTS "Users can read files from owned or public projects" ON project_files;
CREATE POLICY "Users can read files from owned, collaborative or public projects" 
  ON project_files 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (
        projects.user_id = auth.uid() OR 
        projects.is_public = true OR
        EXISTS (
          SELECT 1 FROM project_collaborators 
          WHERE project_collaborators.project_id = projects.id 
          AND project_collaborators.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can add files to owned projects" ON project_files;
CREATE POLICY "Users can add files to owned or writable projects" 
  ON project_files 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (
        projects.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators 
          WHERE project_collaborators.project_id = projects.id 
          AND project_collaborators.user_id = auth.uid()
          AND project_collaborators.permission IN ('write', 'admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update files in owned projects" ON project_files;
CREATE POLICY "Users can update files in owned or writable projects" 
  ON project_files 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (
        projects.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators 
          WHERE project_collaborators.project_id = projects.id 
          AND project_collaborators.user_id = auth.uid()
          AND project_collaborators.permission IN ('write', 'admin')
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete files from owned projects" ON project_files;
CREATE POLICY "Users can delete files from owned or writable projects" 
  ON project_files 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_files.project_id 
      AND (
        projects.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM project_collaborators 
          WHERE project_collaborators.project_id = projects.id 
          AND project_collaborators.user_id = auth.uid()
          AND project_collaborators.permission IN ('write', 'admin')
        )
      )
    )
  );

-- Create triggers for collaboration invites
CREATE TRIGGER set_timestamp_project_collaborators
BEFORE UPDATE ON project_collaborators
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_collaboration_invites
BEFORE UPDATE ON collaboration_invites
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Trigger function to create notification for collaboration invite
CREATE OR REPLACE FUNCTION notify_on_collaboration_invite()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.invitee_id,
    NEW.inviter_id,
    'collaboration_invite',
    (SELECT username FROM profiles WHERE id = NEW.inviter_id) || ' invited you to collaborate on ' || 
    (SELECT name FROM projects WHERE id = NEW.project_id),
    NEW.id,
    'collaboration_invite'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_collaboration_invite_insert
AFTER INSERT ON collaboration_invites
FOR EACH ROW
EXECUTE FUNCTION notify_on_collaboration_invite();

-- Trigger function to create collaborator after invite is accepted
CREATE OR REPLACE FUNCTION handle_collaboration_invite_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If invite was accepted, create the collaborator entry
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO project_collaborators (project_id, user_id, permission)
    VALUES (NEW.project_id, NEW.invitee_id, NEW.permission);
    
    -- Notify the inviter that the invite was accepted
    PERFORM create_notification(
      NEW.inviter_id,
      NEW.invitee_id,
      'invite_accepted',
      (SELECT username FROM profiles WHERE id = NEW.invitee_id) || ' accepted your invitation to collaborate on ' || 
      (SELECT name FROM projects WHERE id = NEW.project_id),
      NEW.project_id,
      'project'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_collaboration_invite_update
AFTER UPDATE ON collaboration_invites
FOR EACH ROW
WHEN (NEW.status <> OLD.status)
EXECUTE FUNCTION handle_collaboration_invite_update();