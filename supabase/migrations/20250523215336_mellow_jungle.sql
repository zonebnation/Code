/*
  # Dev Reels Schema
  
  1. New Tables
    - `videos`: Stores developer tutorial videos
      - `id` (uuid, primary key): Unique identifier for the video
      - `user_id` (uuid): Creator of the video, references profiles
      - `title` (text): Video title
      - `description` (text): Video description
      - `video_url` (text): URL to the video file
      - `thumbnail_url` (text): URL to the thumbnail image
      - `project_id` (uuid): Optional reference to a project
      - `duration` (integer): Length of the video in seconds
      - `views` (integer): View count
      - `created_at` (timestamptz): When video was created
      - `updated_at` (timestamptz): When video was last updated
    
    - `video_likes`: Tracks likes on videos
      - `id` (uuid, primary key): Unique identifier for the like
      - `video_id` (uuid): References videos table
      - `user_id` (uuid): User who liked the video, references profiles
      - `created_at` (timestamptz): When the like was created
    
    - `video_comments`: Stores comments on videos
      - `id` (uuid, primary key): Unique identifier for the comment
      - `video_id` (uuid): References videos table
      - `user_id` (uuid): User who made the comment, references profiles
      - `content` (text): Comment content
      - `created_at` (timestamptz): When comment was created
      - `updated_at` (timestamptz): When comment was last updated
    
    - `video_tags`: Stores tags for videos
      - `id` (uuid, primary key): Unique identifier for the tag relationship
      - `video_id` (uuid): References videos table
      - `tag` (text): The tag name
      
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

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
CREATE INDEX videos_user_id_idx ON videos(user_id);
CREATE INDEX videos_project_id_idx ON videos(project_id);
CREATE INDEX video_likes_video_id_idx ON video_likes(video_id);
CREATE INDEX video_likes_user_id_idx ON video_likes(user_id);
CREATE INDEX video_comments_video_id_idx ON video_comments(video_id);
CREATE INDEX video_comments_user_id_idx ON video_comments(user_id);
CREATE INDEX video_tags_video_id_idx ON video_tags(video_id);
CREATE INDEX video_tags_tag_idx ON video_tags(tag);

-- Security policies for videos

-- Read access: All videos are publicly readable
CREATE POLICY "Videos are publicly viewable" 
  ON videos 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert access: Authenticated users can create videos
CREATE POLICY "Users can create videos" 
  ON videos 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Update access: Only the creator can update their videos
CREATE POLICY "Users can update own videos" 
  ON videos 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Delete access: Only the creator can delete their videos
CREATE POLICY "Users can delete own videos" 
  ON videos 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Security policies for video_likes

-- Read access: Video likes are publicly readable
CREATE POLICY "Video likes are publicly viewable" 
  ON video_likes 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert access: Authenticated users can like videos
CREATE POLICY "Users can like videos" 
  ON video_likes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Delete access: Users can remove their own likes
CREATE POLICY "Users can remove own likes" 
  ON video_likes 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Security policies for video_comments

-- Read access: Comments are publicly readable
CREATE POLICY "Comments are publicly viewable" 
  ON video_comments 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert access: Authenticated users can comment on videos
CREATE POLICY "Users can comment on videos" 
  ON video_comments 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Update access: Users can edit their own comments
CREATE POLICY "Users can update own comments" 
  ON video_comments 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Delete access: Users can delete their own comments
CREATE POLICY "Users can delete own comments" 
  ON video_comments 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Security policies for video_tags

-- Read access: Tags are publicly readable
CREATE POLICY "Tags are publicly viewable" 
  ON video_tags 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert, update, delete: Only video owners can manage tags
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

-- Create trigger function to update updated_at timestamp for videos and comments
CREATE TRIGGER set_timestamp_videos
BEFORE UPDATE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER set_timestamp_video_comments
BEFORE UPDATE ON video_comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET views = views + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;