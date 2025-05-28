-- Create the updated_at timestamp function for all tables
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 1. USER MANAGEMENT
-- ==============================

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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create policies for profiles
CREATE POLICY "Users can read own profile" 
  ON profiles 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

-- Drop existing trigger and function to prevent conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a function to create a profile for a new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    new.id, 
    CASE WHEN new.raw_user_meta_data->>'username' IS NULL THEN new.email ELSE new.raw_user_meta_data->>'username' END,
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create follows table for user relationships
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Follows are publicly viewable" ON follows;
DROP POLICY IF EXISTS "Users can create follows" ON follows;
DROP POLICY IF EXISTS "Users can delete own follows" ON follows;

-- Policies for follows
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

-- Drop existing function and trigger to prevent conflicts
DROP TRIGGER IF EXISTS update_follow_counts_trigger ON follows;
DROP FUNCTION IF EXISTS update_follow_counts();

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

-- Create trigger for follow counts
CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();

-- ==============================
-- 2. PROJECTS SYSTEM
-- ==============================

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  is_collaborative BOOLEAN DEFAULT false,
  collaborators_can_invite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_projects ON projects;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_projects
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

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
CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON project_files(project_id);
CREATE INDEX IF NOT EXISTS project_files_parent_id_idx ON project_files(parent_id);

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_project_files ON project_files;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_project_files
BEFORE UPDATE ON project_files
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read own or collaborative projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- Policies for projects
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read files from owned, collaborative or public projec" ON project_files;
DROP POLICY IF EXISTS "Users can add files to owned or writable projects" ON project_files;
DROP POLICY IF EXISTS "Users can update files in owned or writable projects" ON project_files;
DROP POLICY IF EXISTS "Users can delete files from owned or writable projects" ON project_files;

-- Policies for project_files
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

-- ==============================
-- 3. COLLABORATION FEATURES
-- ==============================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS project_collaborators_project_id_idx ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS project_collaborators_user_id_idx ON project_collaborators(user_id);

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_project_collaborators ON project_collaborators;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_project_collaborators
BEFORE UPDATE ON project_collaborators
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

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
CREATE INDEX IF NOT EXISTS collaboration_invites_project_id_idx ON collaboration_invites(project_id);
CREATE INDEX IF NOT EXISTS collaboration_invites_inviter_id_idx ON collaboration_invites(inviter_id);
CREATE INDEX IF NOT EXISTS collaboration_invites_invitee_id_idx ON collaboration_invites(invitee_id);
CREATE INDEX IF NOT EXISTS collaboration_invites_status_idx ON collaboration_invites(status);

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_collaboration_invites ON collaboration_invites;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_collaboration_invites
BEFORE UPDATE ON collaboration_invites
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "ProjectCollaboratorsViewPolicy_v3" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsInsertPolicy_v3" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsUpdatePolicy_v3" ON project_collaborators;
DROP POLICY IF EXISTS "ProjectCollaboratorsDeletePolicy_v3" ON project_collaborators;

-- Policies for project_collaborators (fixed to avoid recursion issues)
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Inviters and invitees can update invites" ON collaboration_invites;
DROP POLICY IF EXISTS "Inviters and project owners can delete invites" ON collaboration_invites;
DROP POLICY IF EXISTS "Inviters, invitees, and project owners can view invites" ON collaboration_invites;
DROP POLICY IF EXISTS "Project owners and authorized collaborators can create invites" ON collaboration_invites;

-- Policies for collaboration_invites
CREATE POLICY "Inviters and invitees can update invites" 
  ON collaboration_invites 
  FOR UPDATE 
  TO authenticated 
  USING ((inviter_id = auth.uid()) OR (invitee_id = auth.uid()));

CREATE POLICY "Inviters and project owners can delete invites" 
  ON collaboration_invites 
  FOR DELETE 
  TO authenticated 
  USING ((inviter_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = collaboration_invites.project_id) AND (projects.user_id = auth.uid())))));

CREATE POLICY "Inviters, invitees, and project owners can view invites" 
  ON collaboration_invites 
  FOR SELECT 
  TO authenticated 
  USING ((inviter_id = auth.uid()) OR (invitee_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = collaboration_invites.project_id) AND (projects.user_id = auth.uid())))));

CREATE POLICY "Project owners and authorized collaborators can create invites" 
  ON collaboration_invites 
  FOR INSERT 
  TO authenticated 
  WITH CHECK ((EXISTS ( SELECT 1
   FROM projects
  WHERE ((projects.id = collaboration_invites.project_id) AND ((projects.user_id = auth.uid()) OR ((projects.collaborators_can_invite = true) AND (EXISTS ( SELECT 1
           FROM project_collaborators
          WHERE ((project_collaborators.project_id = collaboration_invites.project_id) AND (project_collaborators.user_id = auth.uid()) AND (project_collaborators.permission = ANY (ARRAY['write'::text, 'admin'::text])))))))))));

-- ==============================
-- 4. REALTIME COLLABORATION
-- ==============================

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

-- Create cursor_positions table
CREATE TABLE IF NOT EXISTS cursor_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES collaborative_sessions(id) ON DELETE CASCADE,
  "line" INTEGER NOT NULL,
  "column" INTEGER NOT NULL,
  selection_start_line INTEGER,
  selection_start_column INTEGER,
  selection_end_line INTEGER,
  selection_end_column INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on cursor_positions table
ALTER TABLE cursor_positions ENABLE ROW LEVEL SECURITY;

-- Create edit_operations table
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

-- Create project_messages table for chat
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on project_messages table
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS collaborative_sessions_project_id_idx ON collaborative_sessions(project_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_file_id_idx ON collaborative_sessions(file_id);
CREATE INDEX IF NOT EXISTS collaborative_sessions_user_id_idx ON collaborative_sessions(user_id);
CREATE INDEX IF NOT EXISTS cursor_positions_session_id_idx ON cursor_positions(session_id);
CREATE INDEX IF NOT EXISTS edit_operations_project_id_idx ON edit_operations(project_id);
CREATE INDEX IF NOT EXISTS edit_operations_file_id_idx ON edit_operations(file_id);
CREATE INDEX IF NOT EXISTS edit_operations_user_id_idx ON edit_operations(user_id);
CREATE INDEX IF NOT EXISTS edit_operations_timestamp_idx ON edit_operations("timestamp");
CREATE INDEX IF NOT EXISTS project_messages_project_id_idx ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS project_messages_user_id_idx ON project_messages(user_id);
CREATE INDEX IF NOT EXISTS project_messages_created_at_idx ON project_messages(created_at);

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view collaborative sessions for their projects or whe" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can create collaborative sessions for projects they can a" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can update their own collaborative sessions" ON collaborative_sessions;
DROP POLICY IF EXISTS "Users can delete their own collaborative sessions" ON collaborative_sessions;

-- Policies for collaborative_sessions
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view cursor positions for sessions they can access" ON cursor_positions;
DROP POLICY IF EXISTS "Users can create cursor positions for their own sessions" ON cursor_positions;
DROP POLICY IF EXISTS "Users can update their own cursor positions" ON cursor_positions;
DROP POLICY IF EXISTS "Users can delete their own cursor positions" ON cursor_positions;

-- Policies for cursor_positions
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view edit operations for projects they can access" ON edit_operations;
DROP POLICY IF EXISTS "Users can create edit operations for projects they can edit" ON edit_operations;

-- Policies for edit_operations
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Project owners and collaborators can read messages" ON project_messages;
DROP POLICY IF EXISTS "Project owners and collaborators can add messages" ON project_messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON project_messages;

-- Policies for project messages
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

-- Drop existing functions and triggers to prevent conflicts
DROP FUNCTION IF EXISTS update_collaborative_session_last_active() CASCADE;
DROP FUNCTION IF EXISTS cleanup_inactive_collaborative_sessions() CASCADE;

-- Functions for collaborative editing
CREATE OR REPLACE FUNCTION update_collaborative_session_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE collaborative_sessions
  SET last_active = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS update_session_last_active ON cursor_positions;

-- Create trigger to update last_active
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

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS cleanup_old_sessions ON collaborative_sessions;

-- Create trigger to periodically clean up old sessions
CREATE TRIGGER cleanup_old_sessions
AFTER INSERT ON collaborative_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION cleanup_inactive_collaborative_sessions();

-- ==============================
-- 5. SOCIAL FEATURES
-- ==============================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS videos_user_id_idx ON videos(user_id);
CREATE INDEX IF NOT EXISTS videos_project_id_idx ON videos(project_id);
CREATE INDEX IF NOT EXISTS video_likes_video_id_idx ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS video_likes_user_id_idx ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS video_comments_video_id_idx ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS video_comments_user_id_idx ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS video_tags_video_id_idx ON video_tags(video_id);
CREATE INDEX IF NOT EXISTS video_tags_tag_idx ON video_tags(tag);

-- Drop existing triggers to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_videos ON videos;
DROP TRIGGER IF EXISTS set_timestamp_video_comments ON video_comments;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_videos
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_video_comments
BEFORE UPDATE ON video_comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Videos are publicly viewable" ON videos;
DROP POLICY IF EXISTS "Users can create videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON videos;

-- Policies for videos
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Video likes are publicly viewable" ON video_likes;
DROP POLICY IF EXISTS "Users can like videos" ON video_likes;
DROP POLICY IF EXISTS "Users can remove own likes" ON video_likes;

-- Policies for video_likes
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Comments are publicly viewable" ON video_comments;
DROP POLICY IF EXISTS "Users can comment on videos" ON video_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON video_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON video_comments;

-- Policies for video_comments
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

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Tags are publicly viewable" ON video_tags;
DROP POLICY IF EXISTS "Video owners can manage tags" ON video_tags;

-- Policies for video_tags
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

-- Drop existing function to prevent conflicts
DROP FUNCTION IF EXISTS increment_view_count(UUID);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================
-- 6. NOTIFICATIONS SYSTEM
-- ==============================

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

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON notifications(is_read);

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Only service role can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Policies for notifications
CREATE POLICY "Users can read own notifications" 
  ON notifications 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Only service role can create notifications" 
  ON notifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (false); -- Handled by functions

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

-- Drop existing functions to prevent conflicts
DROP FUNCTION IF EXISTS create_notification(UUID, UUID, TEXT, TEXT, UUID, TEXT);
DROP FUNCTION IF EXISTS notify_on_follow();
DROP FUNCTION IF EXISTS notify_on_comment();
DROP FUNCTION IF EXISTS notify_on_like();
DROP FUNCTION IF EXISTS notify_on_collaboration_invite();
DROP FUNCTION IF EXISTS handle_collaboration_invite_update();
DROP FUNCTION IF EXISTS notify_on_message();

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

-- Trigger functions for notifications
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

-- Drop existing triggers to prevent conflicts
DROP TRIGGER IF EXISTS after_follow_insert ON follows;
DROP TRIGGER IF EXISTS after_comment_insert ON video_comments;
DROP TRIGGER IF EXISTS after_like_insert ON video_likes;
DROP TRIGGER IF EXISTS after_collaboration_invite_insert ON collaboration_invites;
DROP TRIGGER IF EXISTS after_collaboration_invite_update ON collaboration_invites;
DROP TRIGGER IF EXISTS after_message_insert ON project_messages;

-- Create notification triggers
CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow();

CREATE TRIGGER after_comment_insert
AFTER INSERT ON video_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();

CREATE TRIGGER after_like_insert
AFTER INSERT ON video_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_like();

CREATE TRIGGER after_collaboration_invite_insert
AFTER INSERT ON collaboration_invites
FOR EACH ROW
EXECUTE FUNCTION notify_on_collaboration_invite();

CREATE TRIGGER after_collaboration_invite_update
AFTER UPDATE ON collaboration_invites
FOR EACH ROW
WHEN (NEW.status <> OLD.status)
EXECUTE FUNCTION handle_collaboration_invite_update();

CREATE TRIGGER after_message_insert
AFTER INSERT ON project_messages
FOR EACH ROW
EXECUTE FUNCTION notify_on_message();

-- ==============================
-- 7. SETTINGS & SHARING
-- ==============================

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
CREATE UNIQUE INDEX IF NOT EXISTS user_settings_user_id_key_idx ON user_settings (user_id, key);

-- Enable RLS on user_settings table
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_user_settings ON user_settings;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_user_settings
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;

-- Policies for user_settings
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

-- Create indexes
CREATE INDEX IF NOT EXISTS shared_entities_entity_id_idx ON shared_entities(entity_id);
CREATE INDEX IF NOT EXISTS shared_entities_entity_type_idx ON shared_entities(entity_type);
CREATE INDEX IF NOT EXISTS shared_entities_user_id_idx ON shared_entities(user_id);
CREATE INDEX IF NOT EXISTS shared_entities_share_type_idx ON shared_entities(share_type);

-- Drop existing trigger to prevent conflicts
DROP TRIGGER IF EXISTS set_timestamp_shared_entities ON shared_entities;

-- Create trigger for updated_at
CREATE TRIGGER set_timestamp_shared_entities
BEFORE UPDATE ON shared_entities
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can read their own shared entities" ON shared_entities;
DROP POLICY IF EXISTS "Users can create shared entities" ON shared_entities;
DROP POLICY IF EXISTS "Users can update their own shared entities" ON shared_entities;
DROP POLICY IF EXISTS "Users can delete their own shared entities" ON shared_entities;
DROP POLICY IF EXISTS "Anyone can read public shared entities" ON shared_entities;

-- Policies for shared_entities
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

-- ==============================
-- 8. STORAGE BUCKETS AND POLICIES
-- ==============================

-- Create storage buckets
DO $$
BEGIN
  -- Create the avatars bucket if it doesn't exist
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'avatars') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('avatars', 'avatars', true, 2097152, '{image/jpeg,image/png,image/gif,image/webp}');
  END IF;

  -- Create the videos bucket if it doesn't exist
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'videos') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('videos', 'videos', true, 104857600, '{video/mp4,video/webm,video/ogg,video/quicktime,application/mp4}');
  END IF;

  -- Create the shared_files bucket if it doesn't exist
  IF NOT EXISTS (SELECT FROM storage.buckets WHERE name = 'shared_files') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit)
    VALUES ('shared_files', 'shared_files', true, 52428800);
  END IF;
END $$;

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Avatar upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Avatar public read policy" ON storage.objects;
DROP POLICY IF EXISTS "Videos upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Videos public read policy" ON storage.objects;
DROP POLICY IF EXISTS "Videos delete policy" ON storage.objects;
DROP POLICY IF EXISTS "Shared files upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Shared files public read policy" ON storage.objects;
DROP POLICY IF EXISTS "Shared files delete policy" ON storage.objects;

-- Create storage policies

-- Avatars policies
CREATE POLICY "Avatar upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (auth.uid()::text = SPLIT_PART(name, '-', 1))
  );

CREATE POLICY "Avatar public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

-- Videos policies
CREATE POLICY "Videos upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1))
  );

CREATE POLICY "Videos public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'videos');

CREATE POLICY "Videos delete policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'videos' AND
    (auth.uid()::text = SPLIT_PART(name, '/', 1))
  );

-- Shared files policies
CREATE POLICY "Shared files upload policy" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'shared_files');

CREATE POLICY "Shared files public read policy" ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'shared_files');

CREATE POLICY "Shared files delete policy" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'shared_files' AND
    owner = auth.uid()
  );