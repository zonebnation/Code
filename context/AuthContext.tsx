import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Check if we have a session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (mounted) {
          if (session) {
            setSession(session);
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        if (mounted) {
          console.error('Error initializing auth:', error);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (mounted) {
          setSession(newSession);
          setUser(newSession?.user || null);
          
          if (newSession?.user) {
            await fetchProfile(newSession.user.id);
          } else {
            setProfile(null);
          }
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (data) {
        setProfile(data);
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

      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: { username }
        }
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing up:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email
  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing in:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      await AsyncStorage.removeItem('supabase.auth.token');
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing out:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign in with GitHub
  const signInWithGithub = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing in with GitHub:', error.message);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      console.error('Error signing in with Google:', error.message);
    }
  };

  // Update profile
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setError(null);
      setLoading(true);

      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Refetch the profile to update state
      await fetchProfile(user.id);
    } catch (error: any) {
      setError(error.message);
      console.error('Error updating profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // Refresh session
  const refreshSession = async () => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
    } catch (error: any) {
      setError(error.message);
      console.error('Error refreshing session:', error.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
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