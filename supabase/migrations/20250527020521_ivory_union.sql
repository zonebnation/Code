/*
  # Code Canvas - Initial Schema Setup
  
  This migration sets up the complete database schema for the Code Canvas application,
  including user profiles, projects, collaboration features, and social interactions.

  1. Tables and Features
    - User profiles and authentication
    - Projects and project files
    - Collaboration (invitations, sharing, real-time editing)
    - Social features (follows, comments, likes)
    - User settings and preferences
    
  2. Security
    - Row Level Security (RLS) on all tables
    - Proper access control policies
    - Secure triggers and functions
*/

-- ==========================================
-- User Profiles and Authentication
-- ==========================================

-- Create profiles table that references auth.users
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  follower_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profiles
CREATE POLICY "Users can read own profile" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

-- Create policy to allow users to update their own profiles
CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

-- Create policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- Projects and Files
-- ==========================================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  collaborators_can_invite BOOLEAN DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false
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

-- Create auto-update function for timestamps
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

-- Create indexes
CREATE INDEX project_files_project_id_idx ON project_files(project_id);
CREATE INDEX project_files_parent_id_idx ON project_files(parent_id);
CREATE INDEX projects_user_id_idx ON projects(user_id);

-- ==========================================
-- Collaboration 
-- ==========================================

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

-- Collaborative sessions table
CREATE TABLE IF NOT EXISTS collaborative_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, file_id, user_id)
);

-- Enable RLS on collaborative_sessions table
ALTER TABLE collaborative_sessions ENABLE ROW LEVEL SECURITY;

-- Cursor positions table
CREATE TABLE IF NOT EXISTS cursor_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  line INTEGER NOT NULL,
  column INTEGER NOT NULL,
  selection_start_line INTEGER,
  selection_start_column INTEGER,
  selection_end_line INTEGER,
  selection_end_column INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on cursor_positions table
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;

-- Edit operations table
CREATE TABLE IF NOT EXISTS edit_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES project_files(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'delete', 'replace')),
  position_line INTEGER NOT NULL,
  position_column INTEGER NOT NULL,
  text TEXT,
  length INTEGER,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on edit_operations table
ALTER TABLE edit_operations ENABLE ROW LEVEL SECURITY;

-- Project chat messages table
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_messages table
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Social Features
-- ==========================================

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  duration INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Video likes table
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Enable RLS on video_likes table
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;

-- Video comments table
CREATE TABLE IF NOT EXISTS video_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on video_comments table
ALTER TABLE video_comments ENABLE ROW LEVEL SECURITY;

-- Video tags table
CREATE TABLE IF NOT EXISTS video_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  UNIQUE(video_id, tag)
);

-- Enable RLS on video_tags table
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;

-- Follows table
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Shared entities table
CREATE TABLE IF NOT EXISTS shared_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('file', 'project')),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  share_type TEXT NOT NULL CHECK (share_type IN ('public', 'private', 'link')),
  password TEXT,
  expires_at TIMESTAMPTZ,
  allow_download BOOLEAN NOT NULL DEFAULT true,
  allow_copy BOOLEAN NOT NULL DEFAULT true,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on shared_entities table
ALTER TABLE shared_entities ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- User Settings
-- ==========================================

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create a unique index on user_id and key
CREATE UNIQUE INDEX user_settings_user_id_key_idx ON user_settings(user_id, key);

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Security Policies
-- ==========================================

-- Projects policies
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

CREATE POLICY "Users can create own projects" 
  ON projects 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects" 
  ON projects 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects" 
  ON projects 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Project files policies
CREATE POLICY "Users can read files from owned, collaborative or public projec" 
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

-- Project collaborators policies
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

-- Collaboration invites policies
CREATE POLICY "Inviters and invitees can update invites" 
  ON collaboration_invites 
  FOR UPDATE 
  TO authenticated 
  USING (
    inviter_id = auth.uid() OR 
    invitee_id = auth.uid()
  );

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

-- Collaborative editing policies
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

-- Project messages policies
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

CREATE POLICY "Users can delete own messages"
  ON project_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Video related policies
CREATE POLICY "Videos are publicly viewable" 
  ON videos 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create videos" 
  ON videos 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own videos" 
  ON videos 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own videos" 
  ON videos 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Video likes policies
CREATE POLICY "Video likes are publicly viewable" 
  ON video_likes 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can like videos" 
  ON video_likes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own likes" 
  ON video_likes 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Video comments policies
CREATE POLICY "Comments are publicly viewable" 
  ON video_comments 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can comment on videos" 
  ON video_comments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own comments" 
  ON video_comments 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own comments" 
  ON video_comments 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Video tags policies
CREATE POLICY "Tags are publicly viewable" 
  ON video_tags 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Video owners can manage tags" 
  ON video_tags 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = video_tags.video_id 
      AND videos.user_id = auth.uid()
    )
  );

-- Follows policies
CREATE POLICY "Follows are publicly viewable" 
  ON follows 
  FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Users can create follows" 
  ON follows 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Users can delete own follows" 
  ON follows 
  FOR DELETE 
  TO authenticated 
  USING (follower_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can read own notifications" 
  ON notifications 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Only service role can create notifications" 
  ON notifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (false);

CREATE POLICY "Users can update own notifications" 
  ON notifications 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications" 
  ON notifications 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Shared entities policies
CREATE POLICY "Users can read their own shared entities" 
  ON shared_entities 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create shared entities" 
  ON shared_entities 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own shared entities" 
  ON shared_entities 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own shared entities" 
  ON shared_entities 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read public shared entities" 
  ON shared_entities 
  FOR SELECT 
  TO anon 
  USING (share_type = 'public');

-- User settings policies
CREATE POLICY "Users can read their own settings" 
  ON user_settings 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own settings" 
  ON user_settings 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own settings" 
  ON user_settings 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own settings" 
  ON user_settings 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- ==========================================
-- Triggers and Functions
-- ==========================================

-- Function to handle new users
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'username', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle collaboration invite updates
CREATE OR REPLACE FUNCTION handle_collaboration_invite_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If invite was accepted, create the collaborator entry
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO project_collaborators (project_id, user_id, permission)
    VALUES (NEW.project_id, NEW.invitee_id, NEW.permission);
    
    -- Notify the inviter that the invite was accepted
    INSERT INTO notifications (
      user_id,
      sender_id,
      type,
      content,
      reference_id,
      reference_type
    ) VALUES (
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

-- Trigger for collaboration invite updates
CREATE TRIGGER after_collaboration_invite_update
  AFTER UPDATE ON collaboration_invites
  FOR EACH ROW
  WHEN (NEW.status <> OLD.status)
  EXECUTE FUNCTION handle_collaboration_invite_update();

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_sender_id UUID,
  p_type TEXT,
  p_content TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  -- Don't create notification if sender is the same as receiver
  IF p_user_id = p_sender_id THEN
    RETURN NULL;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id, 
    sender_id, 
    type, 
    content, 
    reference_id, 
    reference_type
  ) VALUES (
    p_user_id, 
    p_sender_id, 
    p_type, 
    p_content, 
    p_reference_id, 
    p_reference_type
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send notification on collaboration invite
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

-- Trigger for collaboration invite notifications
CREATE TRIGGER after_collaboration_invite_insert
  AFTER INSERT ON collaboration_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_collaboration_invite();

-- Function to send notification on new message
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

-- Trigger for message notifications
CREATE TRIGGER after_message_insert
  AFTER INSERT ON project_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_message();

-- Function to send notification on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_notification(
    NEW.following_id,
    NEW.follower_id,
    'follow',
    (SELECT username FROM profiles WHERE id = NEW.follower_id) || ' started following you',
    NEW.id,
    'follow'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for follow notifications
CREATE TRIGGER after_follow_insert
  AFTER INSERT ON follows
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_follow();

-- Function to update follower/following counts
CREATE OR REPLACE FUNCTION update_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the followed user
    UPDATE profiles
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;
    
    -- Increment following count for the follower
    UPDATE profiles
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count for the followed user
    UPDATE profiles
    SET follower_count = GREATEST(follower_count - 1, 0)
    WHERE id = OLD.following_id;
    
    -- Decrement following count for the follower
    UPDATE profiles
    SET following_count = GREATEST(following_count - 1, 0)
    WHERE id = OLD.follower_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for updating follow counts
CREATE TRIGGER update_follow_counts_trigger
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW
  EXECUTE FUNCTION update_follow_counts();

-- Function to send notification on comment
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
BEGIN
  -- Get the video owner
  SELECT user_id INTO video_owner_id FROM videos WHERE id = NEW.video_id;
  
  -- Create notification for video owner
  PERFORM create_notification(
    video_owner_id,
    NEW.user_id,
    'comment',
    (SELECT username FROM profiles WHERE id = NEW.user_id) || ' commented on your video',
    NEW.id,
    'comment'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for comment notifications
CREATE TRIGGER after_comment_insert
  AFTER INSERT ON video_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_comment();

-- Function to send notification on like
CREATE OR REPLACE FUNCTION notify_on_like()
RETURNS TRIGGER AS $$
DECLARE
  video_owner_id UUID;
BEGIN
  -- Get the video owner
  SELECT user_id INTO video_owner_id FROM videos WHERE id = NEW.video_id;
  
  -- Create notification for video owner
  PERFORM create_notification(
    video_owner_id,
    NEW.user_id,
    'like',
    (SELECT username FROM profiles WHERE id = NEW.user_id) || ' liked your video',
    NEW.video_id,
    'video'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for like notifications
CREATE TRIGGER after_like_insert
  AFTER INSERT ON video_likes
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_like();

-- Function to update collaborative session last active timestamp
CREATE OR REPLACE FUNCTION update_collaborative_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collaborative_sessions
  SET last_active = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating session last active
CREATE TRIGGER update_session_last_active
  AFTER INSERT OR UPDATE ON cursor_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_collaborative_session_last_active();

-- Function to clean up inactive collaborative sessions
CREATE OR REPLACE FUNCTION cleanup_inactive_collaborative_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM collaborative_sessions
  WHERE last_active < now() - interval '1 hour';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for cleaning up inactive sessions
CREATE TRIGGER cleanup_old_sessions
  AFTER INSERT ON collaborative_sessions
  FOR EACH STATEMENT
  EXECUTE FUNCTION cleanup_inactive_collaborative_sessions();

-- Function to increment video view count
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- Additional update triggers
CREATE TRIGGER set_timestamp_user_settings
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_project_collaborators
  BEFORE UPDATE ON project_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_collaboration_invites
  BEFORE UPDATE ON collaboration_invites
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_videos
  BEFORE UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_video_comments
  BEFORE UPDATE ON video_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_shared_entities
  BEFORE UPDATE ON shared_entities
  FOR EACH ROW
  EXECUTE FUNCTION update_modified_column();

-- Create additional necessary indexes
CREATE INDEX collaboration_invites_project_id_idx ON collaboration_invites(project_id);
CREATE INDEX collaboration_invites_inviter_id_idx ON collaboration_invites(inviter_id);
CREATE INDEX collaboration_invites_invitee_id_idx ON collaboration_invites(invitee_id);
CREATE INDEX collaboration_invites_status_idx ON collaboration_invites(status);
CREATE INDEX project_messages_project_id_idx ON project_messages(project_id);
CREATE INDEX project_messages_user_id_idx ON project_messages(user_id);
CREATE INDEX project_messages_created_at_idx ON project_messages(created_at);
CREATE INDEX videos_user_id_idx ON videos(user_id);
CREATE INDEX videos_project_id_idx ON videos(project_id);
CREATE INDEX video_likes_video_id_idx ON video_likes(video_id);
CREATE INDEX video_likes_user_id_idx ON video_likes(user_id);
CREATE INDEX video_comments_video_id_idx ON video_comments(video_id);
CREATE INDEX video_comments_user_id_idx ON video_comments(user_id);
CREATE INDEX video_tags_video_id_idx ON video_tags(video_id);
CREATE INDEX video_tags_tag_idx ON video_tags(tag);
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);
CREATE INDEX shared_entities_entity_id_idx ON shared_entities(entity_id);
CREATE INDEX shared_entities_entity_type_idx ON shared_entities(entity_type);
CREATE INDEX shared_entities_user_id_idx ON shared_entities(user_id);
CREATE INDEX shared_entities_share_type_idx ON shared_entities(share_type);

-- ==========================================
-- Storage
-- ==========================================

-- Check if storage buckets exist and create them if they don't
DO $$
BEGIN
  -- Try to create the avatars bucket if it doesn't exist
  BEGIN
    EXECUTE 'CREATE BUCKET IF NOT EXISTS avatars WITH (public = true)';
  EXCEPTION WHEN OTHERS THEN
    -- Bucket may already exist or we don't have permission to create it
    NULL;
  END;
  
  -- Try to create the shared_files bucket if it doesn't exist
  BEGIN
    EXECUTE 'CREATE BUCKET IF NOT EXISTS shared_files WITH (public = true)';
  EXCEPTION WHEN OTHERS THEN
    -- Bucket may already exist or we don't have permission to create it
    NULL;
  END;
  
  -- Try to create the videos bucket if it doesn't exist
  BEGIN
    EXECUTE 'CREATE BUCKET IF NOT EXISTS videos WITH (public = true)';
  EXCEPTION WHEN OTHERS THEN
    -- Bucket may already exist or we don't have permission to create it
    NULL;
  END;
END $$;