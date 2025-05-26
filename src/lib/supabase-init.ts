import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mjbhockriytxstmwffjy.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qYmhvY2tyaXl0eHN0bXdmZmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwMzUxNTAsImV4cCI6MjA2MzYxMTE1MH0.DIwmXTjsGcS1I1-PDAewTHUMCJuRelEtso5tNRhwgzY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: localStorage
  }
});

// Initialize storage buckets
export const initializeStorage = async () => {
  try {
    console.log("Checking storage buckets");
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing storage buckets:", error);
      return;
    }
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    if (!avatarsBucket) {
      console.log("Avatars bucket doesn't exist - please create it in the Supabase dashboard");
      console.log("Note: Bucket creation requires admin privileges and should be done through the Supabase dashboard");
      // Don't attempt to create the bucket from client code
    } else {
      console.log("Avatars bucket exists and is available for use");
    }
  } catch (err) {
    console.error("Error checking storage buckets:", err);
  }
};

// Initialize on load
setTimeout(() => {
  initializeStorage().catch(err => {
    console.error("Failed to initialize storage:", err);
  });
}, 1000);

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  following_count?: number;
};