import { supabase } from './supabase';

export type VideoData = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  project_id?: string | null;
  duration: number;
  views: number;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
  like_count: { count: string }[];
  comment_count: { count: string }[];
  video_tags: { tag: string }[];
  is_liked?: boolean;
};

export type FormattedVideo = {
  id: string;
  username: string;
  avatar_url: string | null;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  projectId?: string | null;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  isLiked: boolean;
  createdAt: string;
};

export type VideoComment = {
  id: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
};

class VideoService {
  /**
   * Fetches videos for the user's feed
   */
  async getFeed(page: number = 1, pageSize: number = 10): Promise<FormattedVideo[]> {
    try {
      const apiUrl = `${supabase.supabaseUrl}/functions/v1/get-user-feed?page=${page}&pageSize=${pageSize}`;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch feed');
      }
      
      const result = await response.json();
      return result.videos.map(this.formatVideo);
    } catch (error) {
      console.error('Error fetching video feed:', error);
      throw error;
    }
  }

  /**
   * Fetches a specific video by ID
   */
  async getVideoById(id: string): Promise<FormattedVideo> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        like_count:video_likes(count),
        comment_count:video_comments(count),
        video_tags (tag)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check if current user has liked this video
    const { data: userLike, error: likeError } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', id)
      .single();

    const isLiked = !likeError && userLike;
    
    // Increment view count
    await supabase.rpc('increment_view_count', { video_id: id });

    return this.formatVideo({ ...data, is_liked: !!isLiked });
  }

  /**
   * Uploads a video
   */
  async uploadVideo(file: File, thumbnailFile: File, metadata: {
    title: string;
    description: string;
    tags: string[];
    projectId?: string;
    isPublic?: boolean;
  }): Promise<string> {
    try {
      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');
      
      // Upload video file
      const videoPath = `videos/${session.user.id}/${Date.now()}-${file.name}`;
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, file);

      if (videoError) throw videoError;
      
      // Get video URL
      const { data: videoData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);
      
      // Upload thumbnail
      const thumbnailPath = `thumbnails/${session.user.id}/${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbnailError } = await supabase.storage
        .from('videos')
        .upload(thumbnailPath, thumbnailFile);

      if (thumbnailError) throw thumbnailError;
      
      // Get thumbnail URL
      const { data: thumbnailData } = supabase.storage
        .from('videos')
        .getPublicUrl(thumbnailPath);
      
      // Create video record
      const { data: video, error: videoCreateError } = await supabase
        .from('videos')
        .insert({
          user_id: session.user.id,
          title: metadata.title,
          description: metadata.description,
          video_url: videoData.publicUrl,
          thumbnail_url: thumbnailData.publicUrl,
          project_id: metadata.projectId,
          // Ideally we'd get actual duration, but we'll use a placeholder
          duration: 60,
        })
        .select()
        .single();
      
      if (videoCreateError) throw videoCreateError;
      
      // Add tags
      if (metadata.tags && metadata.tags.length > 0) {
        const tags = metadata.tags.map(tag => ({
          video_id: video.id,
          tag: tag.toLowerCase(),
        }));
        
        const { error: tagsError } = await supabase
          .from('video_tags')
          .insert(tags);
          
        if (tagsError) console.error('Error adding tags:', tagsError);
      }
      
      // If project is provided, make it public if specified
      if (metadata.projectId && metadata.isPublic) {
        const { error: projectError } = await supabase
          .from('projects')
          .update({ is_public: true })
          .eq('id', metadata.projectId);
          
        if (projectError) console.error('Error updating project visibility:', projectError);
      }
      
      return video.id;
    } catch (error) {
      console.error('Error uploading video:', error);
      throw error;
    }
  }

  /**
   * Likes or unlikes a video
   */
  async toggleLike(videoId: string): Promise<boolean> {
    // Check if already liked
    const { data: existingLike, error: checkError } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      throw checkError;
    }

    if (existingLike) {
      // Unlike
      const { error: unlikeError } = await supabase
        .from('video_likes')
        .delete()
        .eq('id', existingLike.id);

      if (unlikeError) throw unlikeError;
      return false;
    } else {
      // Like
      const { error: likeError } = await supabase
        .from('video_likes')
        .insert({ video_id: videoId });

      if (likeError) throw likeError;
      return true;
    }
  }

  /**
   * Adds a comment to a video
   */
  async addComment(videoId: string, content: string): Promise<VideoComment> {
    const { data, error } = await supabase
      .from('video_comments')
      .insert({ video_id: videoId, content })
      .select(`
        id,
        content,
        created_at,
        user:user_id (id, username, avatar_url)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      user: {
        id: data.user.id,
        username: data.user.username,
        avatar_url: data.user.avatar_url,
      },
    };
  }

  /**
   * Gets comments for a video
   */
  async getComments(videoId: string): Promise<VideoComment[]> {
    const { data, error } = await supabase
      .from('video_comments')
      .select(`
        id,
        content,
        created_at,
        user:user_id (id, username, avatar_url)
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map((comment) => ({
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatar_url: comment.user.avatar_url,
      },
    }));
  }

  /**
   * Formats a video from the database to a consistent model
   */
  private formatVideo(video: VideoData): FormattedVideo {
    return {
      id: video.id,
      username: video.profiles.username,
      avatar_url: video.profiles.avatar_url,
      title: video.title,
      description: video.description,
      videoUrl: video.video_url,
      thumbnailUrl: video.thumbnail_url,
      projectId: video.project_id,
      duration: video.duration,
      views: video.views,
      likes: parseInt(video.like_count[0]?.count || '0'),
      comments: parseInt(video.comment_count[0]?.count || '0'),
      tags: video.video_tags.map(tag => tag.tag),
      isLiked: video.is_liked || false,
      createdAt: video.created_at,
    };
  }

  /**
   * Gets videos created by a specific user
   */
  async getUserVideos(userId: string): Promise<FormattedVideo[]> {
    const { data, error } = await supabase
      .from('videos')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        like_count:video_likes(count),
        comment_count:video_comments(count),
        video_tags (tag)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get current user's like status for these videos
    const videoIds = data.map(v => v.id);
    let likedVideoIds = new Set();
    
    if (videoIds.length > 0) {
      const { data: likedVideos } = await supabase
        .from('video_likes')
        .select('video_id')
        .in('video_id', videoIds);
        
      if (likedVideos) {
        likedVideoIds = new Set(likedVideos.map(like => like.video_id));
      }
    }
    
    return data.map(video => this.formatVideo({
      ...video,
      is_liked: likedVideoIds.has(video.id)
    }));
  }

  /**
   * Deletes a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    // Get video details to clean up storage
    const { data: video, error: getError } = await supabase
      .from('videos')
      .select('video_url, thumbnail_url')
      .eq('id', videoId)
      .single();

    if (getError) throw getError;

    // Delete video record
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', videoId);

    if (deleteError) throw deleteError;

    // Clean up storage files
    if (video.video_url) {
      const videoPath = video.video_url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('videos')
        .remove([videoPath]);
    }

    if (video.thumbnail_url) {
      const thumbnailPath = video.thumbnail_url.split('/').slice(-2).join('/');
      await supabase.storage
        .from('videos')
        .remove([thumbnailPath]);
    }
  }
}

export default new VideoService();