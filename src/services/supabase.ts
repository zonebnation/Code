import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials are missing in environment variables. Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are properly set in your .env file.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  }
);

// Initialize storage buckets - only check if they exist, don't try to create them
export const initializeStorage = async () => {
  try {
    // Check if we have proper credentials before attempting to access storage
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase credentials. Cannot initialize storage.");
      return;
    }
    
    console.log("Checking storage buckets");
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing storage buckets:", error);
      return;
    }
    
    console.log("Available storage buckets:", buckets);
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    if (!avatarsBucket) {
      console.log("Avatars bucket doesn't exist. This should be created in the Supabase dashboard.");
      // Don't attempt to create the bucket from client-side code
    } else {
      console.log("Avatars bucket exists and is available for use");
    }
  } catch (err) {
    console.error("Error initializing storage:", err);
  }
};

// Initialize on load - but only if we have credentials
if (supabaseUrl && supabaseAnonKey) {
  setTimeout(() => {
    initializeStorage().catch(err => {
      console.error("Failed to initialize storage:", err);
    });
  }, 1000);
}

export type Profile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  follower_count?: number;
  following_count?: number;
};