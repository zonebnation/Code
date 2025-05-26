import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing in environment variables.');
}

export const supabase = createClient(
  supabaseUrl || 'https://mjbhockriytxstmwffjy.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsImtpZCI6InRpSHovQmJ6b2k1cytwS2hiR1kzeCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qYmhvY2tyaXl0eHN0bXdmZmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI4MDQ5MzYsImV4cCI6MjAyODM4MDkzNn0.5EFB0B6PWuNAcpNI9FKsS-wTchJR-ZRznVx4mVlCGhQ',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: localStorage
    }
  }
);

// Initialize storage buckets
export const initializeStorage = async () => {
  try {
    console.log("Attempting to initialize storage");
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing storage buckets:", error);
      return;
    }
    
    console.log("Available storage buckets:", buckets);
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(bucket => bucket.name === 'avatars');
    if (!avatarsBucket) {
      console.log("Creating avatars bucket...");
      try {
        const { data, error } = await supabase.storage.createBucket('avatars', { 
          public: true,
          fileSizeLimit: 2097152 // 2MB
        });
        
        if (error) {
          console.error("Error creating avatars bucket:", error);
        } else {
          console.log("Avatars bucket created successfully:", data);
        }
      } catch (err) {
        console.error("Exception creating avatars bucket:", err);
      }
    } else {
      console.log("Avatars bucket already exists");
    }
  } catch (err) {
    console.error("Error initializing storage:", err);
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