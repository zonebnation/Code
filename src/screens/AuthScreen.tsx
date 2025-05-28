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
  const [mode, setMode] = useState<'welcome' | 'signin' | 'signup'>('welcome');
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
        // Mark this as first-time login to show welcome screen
        localStorage.setItem('hasSeenWelcome', 'false');
        navigate('/explorer', { replace: true });
      }
    }
  }, [user, loading, location.pathname, navigate]);

  // Redirect to editor if user is already logged in and not in profile update mode
  useEffect(() => {
    if (user && !loading && location.pathname === '/auth' && !location.state?.updateProfile) {
      // Check if this is first-time login
      const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
      if (hasSeenWelcome === 'false') {
        localStorage.setItem('hasSeenWelcome', 'true');
        navigate('/explorer', { replace: true });
      } else {
        navigate('/editor', { replace: true });
      }
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
            border-top: 4px solid ${colors.primary};
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            margin-top: 16px;
            color: ${colors.text};
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
        ) : mode === 'welcome' ? (
          <div className="welcome-container">
            <h1 className="welcome-title" style={{ color: colors.text }}>Welcome to Code Canvas</h1>
            <p className="welcome-subtitle" style={{ color: colors.textSecondary }}>
              Your all-in-one coding environment
            </p>
            
            <div className="auth-buttons">
              <button 
                className="signin-button" 
                onClick={() => setMode('signin')}
                style={{ backgroundColor: colors.primary }}
              >
                Sign In
              </button>
              <button 
                className="signup-button" 
                onClick={() => setMode('signup')}
                style={{ borderColor: colors.primary, color: colors.primary }}
              >
                Create Account
              </button>
            </div>
            
            <div className="features">
              <div className="feature" style={{ backgroundColor: colors.background }}>
                <div className="feature-icon" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>✓</div>
                <span>Real-time collaboration</span>
              </div>
              <div className="feature" style={{ backgroundColor: colors.background }}>
                <div className="feature-icon" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>✓</div>
                <span>Cloud sync across devices</span>
              </div>
              <div className="feature" style={{ backgroundColor: colors.background }}>
                <div className="feature-icon" style={{ backgroundColor: `${colors.primary}20`, color: colors.primary }}>✓</div>
                <span>Integrated terminal</span>
              </div>
            </div>
          </div>
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
      
      <style dangerouslySetInnerHTML={{ __html: `
        .auth-screen {
          min-height: 100vh;
          min-height: calc(var(--vh, 1vh) * 100);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .auth-container {
          width: 100%;
          max-width: 440px;
          border-radius: 16px;
          padding: 40px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        .logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }
        
        .logo {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          object-fit: contain;
        }
        
        .welcome-container {
          text-align: center;
        }
        
        .welcome-title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 12px;
        }
        
        .welcome-subtitle {
          font-size: 16px;
          margin-bottom: 32px;
        }
        
        .auth-buttons {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .signin-button, .signup-button {
          width: 100%;
          height: 50px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s, opacity 0.2s;
        }
        
        .signin-button {
          border: none;
          color: white;
        }
        
        .signup-button {
          background-color: transparent;
          border: 2px solid;
        }
        
        .signin-button:hover, .signup-button:hover {
          opacity: 0.9;
        }
        
        .signin-button:active, .signup-button:active {
          transform: scale(0.98);
        }
        
        .features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }
        
        .feature {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          color: ${colors.text};
        }
        
        .feature-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 12px;
          font-weight: bold;
        }
        
        @media (max-width: 480px) {
          .auth-container {
            padding: 24px;
            margin: 0 16px;
            max-width: 100%;
            border-radius: 12px;
          }
          
          .welcome-title {
            font-size: 24px;
          }
          
          .logo {
            width: 64px;
            height: 64px;
          }
          
          .signin-button, .signup-button {
            height: 48px;
          }
        }
      `}} />
    </div>
  );
};

export default AuthScreen;