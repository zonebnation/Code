import { supabase } from './supabase';
import { Profile } from './supabase';

export type Notification = {
  id: string;
  type: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender?: {
    id: string;
    username: string;
    avatar_url: string | null;
  } | null;
  reference_id?: string | null;
  reference_type?: string | null;
};

class SocialService {
  /**
   * Follows a user
   */
  async followUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .insert({ following_id: userId });

    if (error) throw error;
  }

  /**
   * Unfollows a user
   */
  async unfollowUser(userId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('following_id', userId);

    if (error) throw error;
  }

  /**
   * Checks if the current user is following another user
   */
  async isFollowing(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', userId)
      .single();

    return !error && !!data;
  }

  /**
   * Gets a user's followers
   */
  async getFollowers(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:follower_id (id, username, avatar_url)
      `)
      .eq('following_id', userId);

    if (error) throw error;

    return data.map(item => item.follower);
  }

  /**
   * Gets users that a user is following
   */
  async getFollowing(userId: string): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:following_id (id, username, avatar_url)
      `)
      .eq('follower_id', userId);

    if (error) throw error;

    return data.map(item => item.following);
  }

  /**
   * Gets user notifications
   */
  async getNotifications(limit: number = 20, offset: number = 0): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:sender_id (id, username, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return data;
  }

  /**
   * Marks notifications as read
   */
  async markNotificationsAsRead(notificationIds: string[]): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds);

    if (error) throw error;
  }

  /**
   * Gets the count of unread notifications
   */
  async getUnreadNotificationCount(): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('is_read', false);

    if (error) throw error;

    return count || 0;
  }

  /**
   * Searches for users by username
   */
  async searchUsers(query: string, limit: number = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .ilike('username', `%${query}%`)
      .limit(limit);

    if (error) throw error;

    return data;
  }
}

export default new SocialService();