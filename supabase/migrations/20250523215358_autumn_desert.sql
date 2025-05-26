/*
  # Social Features Schema
  
  1. New Tables
    - `follows`: User following relationships
      - `id` (uuid, primary key): Unique identifier for the relationship
      - `follower_id` (uuid): User who is following, references profiles
      - `following_id` (uuid): User being followed, references profiles
      - `created_at` (timestamptz): When the follow was created
    
    - `notifications`: System for user notifications
      - `id` (uuid, primary key): Unique identifier for the notification
      - `user_id` (uuid): User receiving the notification, references profiles
      - `sender_id` (uuid): User causing the notification (optional), references profiles
      - `type` (text): Type of notification (like, comment, follow, etc.)
      - `content` (text): Content of the notification
      - `reference_id` (uuid): Reference to the relevant object (video, comment, etc.)
      - `reference_type` (text): Type of the referenced object
      - `is_read` (boolean): Whether the notification has been read
      - `created_at` (timestamptz): When the notification was created
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

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

-- Create indexes
CREATE INDEX follows_follower_id_idx ON follows(follower_id);
CREATE INDEX follows_following_id_idx ON follows(following_id);
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_is_read_idx ON notifications(is_read);

-- Security policies for follows

-- Read access: Follows are publicly readable
CREATE POLICY "Follows are publicly viewable" 
  ON follows 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Insert access: Users can follow others
CREATE POLICY "Users can create follows" 
  ON follows 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (follower_id = auth.uid());

-- Delete access: Users can unfollow
CREATE POLICY "Users can delete own follows" 
  ON follows 
  FOR DELETE 
  TO authenticated 
  USING (follower_id = auth.uid());

-- Security policies for notifications

-- Read access: Users can only read their own notifications
CREATE POLICY "Users can read own notifications" 
  ON notifications 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

-- Insert access: Service role only (handled by functions/triggers)
CREATE POLICY "Only service role can create notifications" 
  ON notifications 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (false); -- Will be overridden by service role

-- Update access: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" 
  ON notifications 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Delete access: Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" 
  ON notifications 
  FOR DELETE 
  TO authenticated 
  USING (user_id = auth.uid());

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

-- Trigger for follow notification
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

CREATE TRIGGER after_follow_insert
AFTER INSERT ON follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_follow();

-- Trigger for comment notification
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

CREATE TRIGGER after_comment_insert
AFTER INSERT ON video_comments
FOR EACH ROW
EXECUTE FUNCTION notify_on_comment();

-- Trigger for like notification
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

CREATE TRIGGER after_like_insert
AFTER INSERT ON video_likes
FOR EACH ROW
EXECUTE FUNCTION notify_on_like();

-- Add follower_count and following_count columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS follower_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS following_count INTEGER NOT NULL DEFAULT 0;

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

CREATE TRIGGER update_follow_counts_trigger
AFTER INSERT OR DELETE ON follows
FOR EACH ROW
EXECUTE FUNCTION update_follow_counts();