import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '../services/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, username?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
  signInWithGithub: async () => {},
  signInWithGoogle: async () => {},
  updateProfile: async () => {},
  refreshSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state
  useEffect(() => {
    console.log("AuthProvider: Initializing auth state");
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session fetch error:", error);
          throw error;
        }

        if (mounted) {
          console.log("Initial session:", session ? "exists" : "null");
          if (session) {
            setSession(session);
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing auth:', error);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("Auth state changed:", event, newSession ? "Session exists" : "No session");
        if (mounted) {
          if (newSession) {
            console.log("Setting new session and user");
            setSession(newSession);
            setUser(newSession.user);
            await fetchProfile(newSession.user.id);
          } else {
            console.log("Clearing auth state");
            setSession(null);
            setUser(null);
            setProfile(null);
          }
          
          // Always update loading state after auth change
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  // Fetch user profile
  const fetchProfile = async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        throw error;
      }
      
      if (data) {
        console.log("Profile data retrieved:", data);
        setProfile(data);
      } else {
        console.log("No profile found for user, creating one...");
        // Create a profile if none exists
        const { error: createError } = await supabase
          .from('profiles')
          .insert({ id: userId });
        
        if (createError) {
          console.error("Error creating profile:", createError);
        } else {
          // Fetch the newly created profile
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (newProfile) {
            setProfile(newProfile);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  // Sign up with email
  const signUp = async (email: string, password: string, username?: string) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log("Signing up user with email:", email);
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });

      if (error) throw error;
      
      console.log("Sign up successful:", data);
      
      // Set user and session immediately
      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        
        // Create a profile if signup was successful
        if (data.user.id && username) {
          await supabase
            .from('profiles')
            .upsert({ 
              id: data.user.id, 
              username 
            });
        }
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      
      console.log("Signing in user with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
      
      console.log("Sign in successful:", data);
      
      // Set user and session immediately
      setUser(data.user);
      setSession(data.session);
      
      // Store a first-time login flag to show quick start button
      if (!localStorage.getItem('hasSeenWelcome')) {
        localStorage.setItem('hasSeenWelcome', 'false');
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      console.log("Signing out user");
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Explicitly clear state
      setUser(null);
      setSession(null);
      setProfile(null);
      
      // Clear local storage
      localStorage.removeItem('supabase.auth.token');
      console.log("Sign out successful");
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      setError(null);
      console.log("Starting GitHub sign in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) throw error;
      console.log("GitHub auth initiated:", data);
    } catch (error: any) {
      console.error('Error signing in with GitHub:', error);
      setError(error.message);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log("Starting Google sign in");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      });
      
      if (error) throw error;
      console.log("Google auth initiated:", data);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setError(error.message);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      setLoading(true);

      if (!user) throw new Error('User not authenticated');
      
      console.log("Updating profile:", updates);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;
      
      console.log("Profile updated successfully");
      
      // Refetch the profile to update state
      await fetchProfile(user.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      setError(null);
      setLoading(true);
      console.log("Refreshing session");
      
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        console.log("Session refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
        
        // Also fetch profile data
        if (data.session.user) {
          await fetchProfile(data.session.user.id);
        }
      } else {
        console.log("No session after refresh");
        setSession(null);
        setUser(null);
      }
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading: loading && !initialized, // Only consider loading if not initialized
        error,
        signUp,
        signIn,
        signOut,
        signInWithGithub,
        signInWithGoogle,
        updateProfile,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};