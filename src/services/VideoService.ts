import { supabase } from '../lib/supabase-init';

export type VideoData = {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  username: string;
  userAvatar: string | null;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  createdAt: string;
};

export type VideoComment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
};

class VideoService {
  // Get videos for the feed
  async getFeed(page: number = 1, limit: number = 10): Promise<VideoData[]> {
    try {
      // In a real implementation, this would fetch from the database
      // For now, we'll return simulated data
      const videos: VideoData[] = [
        {
          id: '1',
          title: 'Building a React Component Library',
          description: 'Learn how to create a reusable component library with React and TypeScript',
          videoUrl: 'https://example.com/videos/1.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg',
          username: 'reactmaster',
          userAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
          views: 1250,
          likes: 87,
          comments: 23,
          tags: ['react', 'typescript', 'frontend'],
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          title: 'Modern CSS Techniques',
          description: 'Explore advanced CSS features like Grid, Flexbox, and CSS Variables',
          videoUrl: 'https://example.com/videos/2.mp4',
          thumbnailUrl: 'https://images.pexels.com/photos/11035471/pexels-photo-11035471.jpeg',
          username: 'cssninjas',
          userAvatar: 'https://randomuser.me/api/portraits/women/2.jpg',
          views: 980,
          likes: 65,
          comments: 12,
          tags: ['css', 'webdesign', 'frontend'],
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      return videos;
    } catch (error) {
      console.error('Error fetching video feed:', error);
      throw error;
    }
  }
  
  // Get a specific video
  async getVideo(id: string): Promise<VideoData | null> {
    try {
      // In a real implementation, this would fetch from the database
      const videos = await this.getFeed();
      return videos.find(v => v.id === id) || null;
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      throw error;
    }
  }
  
  // Like a video
  async likeVideo(id: string): Promise<void> {
    try {
      // In a real implementation, this would update the database
      console.log(`Liked video ${id}`);
    } catch (error) {
      console.error(`Error liking video ${id}:`, error);
      throw error;
    }
  }
  
  // Add a comment to a video
  async addComment(videoId: string, content: string): Promise<VideoComment> {
    try {
      // In a real implementation, this would add to the database
      const comment: VideoComment = {
        id: Date.now().toString(),
        content,
        createdAt: new Date().toISOString(),
        user: {
          id: 'user-1', // Would be the current user's ID
          username: 'currentuser',
          avatarUrl: null
        }
      };
      
      return comment;
    } catch (error) {
      console.error(`Error adding comment to video ${videoId}:`, error);
      throw error;
    }
  }
  
  // Get comments for a video
  async getComments(videoId: string): Promise<VideoComment[]> {
    try {
      // In a real implementation, this would fetch from the database
      const comments: VideoComment[] = [
        {
          id: '1',
          content: 'Great video! Really helpful.',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-2',
            username: 'webdev123',
            avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg'
          }
        },
        {
          id: '2',
          content: 'Thanks for sharing this tutorial!',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-3',
            username: 'coder42',
            avatarUrl: 'https://randomuser.me/api/portraits/women/4.jpg'
          }
        }
      ];
      
      return comments;
    } catch (error) {
      console.error(`Error fetching comments for video ${videoId}:`, error);
      throw error;
    }
  }
}

export default new VideoService();