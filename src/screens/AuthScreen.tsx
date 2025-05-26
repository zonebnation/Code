import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import SignIn from '../components/Auth/SignIn';
import SignUp from '../components/Auth/SignUp';
import ProfileForm from '../components/Auth/ProfileForm';

const AuthScreen = () => {
  const { colors } = useTheme();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const navigate = useNavigate();
  const location = useLocation();
  const [processingAuth, setProcessingAuth] = useState(true);
  
  useEffect(() => {
    console.log("AuthScreen - Current path:", location.pathname);
    console.log("AuthScreen - Auth state:", { user: user ? "exists" : "null", loading });
    
    // Add a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setProcessingAuth(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [location.pathname, user, loading]);
  
  // Clear processing state once loading is false
  useEffect(() => {
    if (!loading) {
      setProcessingAuth(false);
    }
  }, [loading]);

  // Handle OAuth callbacks
  useEffect(() => {
    if (location.pathname === '/auth/callback' && !loading) {
      console.log("Processing OAuth callback, user:", user ? "exists" : "null");
      
      // If user is authenticated, redirect to editor
      if (user) {
        navigate('/editor', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  // Redirect to editor if user is already logged in and not in profile update mode
  useEffect(() => {
    if (user && !loading && location.pathname === '/auth' && !location.state?.updateProfile) {
      navigate('/editor', { replace: true });
    }
  }, [user, loading, navigate, location]);

  // Show loading state during authentication
  if (loading && processingAuth) {
    return (
      <div className="auth-screen" style={{ backgroundColor: colors.background }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading...</p>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          .auth-screen {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            border-top: 4px solid #3794FF;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            margin-top: 16px;
            color: #CCCCCC;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}} />
      </div>
    );
  }

  return (
    <div className="auth-screen" style={{ backgroundColor: colors.background }}>
      <div className="auth-container" style={{ backgroundColor: colors.surface }}>
        <div className="logo-container">
          <img src="/images/logo.png" alt="Code Canvas" className="logo" 
               onError={(e) => {
                 e.currentTarget.onerror = null; 
                 e.currentTarget.src = "https://placehold.co/80x80/3794FF/FFFFFF?text=CC";
               }}
          />
        </div>

        {user ? (
          <ProfileForm />
        ) : (
          <>
            {mode === 'signin' ? (
              <SignIn onSwitch={() => setMode('signup')} />
            ) : (
              <SignUp onSwitch={() => setMode('signin')} />
            )}
          </>
        )}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .auth-screen {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .auth-container {
          width: 100%;
          max-width: 440px;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          border-radius: 8px;
        }
      `}} />
    </div>
  );
};

export default AuthScreen;