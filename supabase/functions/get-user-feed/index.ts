// Follow imports
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the Auth context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get query params
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // Calculate offset
    const offset = (page - 1) * pageSize;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Authentication error' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get videos from followed users and popular videos
    const { data: followingIds, error: followingError } = await supabaseClient
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    if (followingError) {
      return new Response(JSON.stringify({ error: 'Error fetching following users' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const followingUserIds = followingIds.map(f => f.following_id);
    
    // Prepare query for videos
    let query = supabaseClient
      .from('videos')
      .select(`
        *,
        profiles:user_id (username, avatar_url),
        like_count:video_likes(count),
        comment_count:video_comments(count),
        video_tags (tag)
      `)
      .order('created_at', { ascending: false })
      .limit(pageSize)
      .range(offset, offset + pageSize - 1);
      
    // If following users, prioritize their videos
    if (followingUserIds.length > 0) {
      query = query.in('user_id', [...followingUserIds, user.id]);
    }

    const { data: videos, error: videosError } = await query;

    if (videosError) {
      return new Response(JSON.stringify({ error: 'Error fetching videos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Get like status for the returned videos
    const videoIds = videos.map(video => video.id);
    
    const { data: likedVideos, error: likedError } = await supabaseClient
      .from('video_likes')
      .select('video_id')
      .eq('user_id', user.id)
      .in('video_id', videoIds);
      
    if (likedError) {
      return new Response(JSON.stringify({ error: 'Error fetching liked videos' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const likedVideoIds = new Set(likedVideos.map(like => like.video_id));
    
    // Format response
    const formattedVideos = videos.map(video => {
      // Format tags
      const tags = video.video_tags.map(tag => tag.tag);
      
      return {
        ...video,
        video_tags: tags,
        is_liked: likedVideoIds.has(video.id),
        like_count: parseInt(video.like_count[0]?.count || '0'),
        comment_count: parseInt(video.comment_count[0]?.count || '0'),
      };
    });
    
    // If not enough videos from following, get popular videos
    if (formattedVideos.length < pageSize && followingUserIds.length > 0) {
      const existingIds = formattedVideos.map(v => v.id);
      
      const { data: popularVideos, error: popularError } = await supabaseClient
        .from('videos')
        .select(`
          *,
          profiles:user_id (username, avatar_url),
          like_count:video_likes(count),
          comment_count:video_comments(count),
          video_tags (tag)
        `)
        .not('id', 'in', existingIds)
        .order('views', { ascending: false })
        .limit(pageSize - formattedVideos.length);
        
      if (!popularError && popularVideos) {
        const additionalVideoIds = popularVideos.map(video => video.id);
        
        // Get like status for additional videos
        let additionalLikedVideoIds = new Set();
        if (additionalVideoIds.length > 0) {
          const { data: additionalLiked } = await supabaseClient
            .from('video_likes')
            .select('video_id')
            .eq('user_id', user.id)
            .in('video_id', additionalVideoIds);
            
          if (additionalLiked) {
            additionalLikedVideoIds = new Set(additionalLiked.map(like => like.video_id));
          }
        }
        
        const formattedPopular = popularVideos.map(video => {
          const tags = video.video_tags.map(tag => tag.tag);
          
          return {
            ...video,
            video_tags: tags,
            is_liked: additionalLikedVideoIds.has(video.id),
            like_count: parseInt(video.like_count[0]?.count || '0'),
            comment_count: parseInt(video.comment_count[0]?.count || '0'),
          };
        });
        
        formattedVideos.push(...formattedPopular);
      }
    }

    return new Response(JSON.stringify({ videos: formattedVideos }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});