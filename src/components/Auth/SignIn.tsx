import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Github, Mail, Lock, ToggleLeft } from 'lucide-react';

interface SignInProps {
  onSwitch: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSwitch }) => {
  const { colors } = useTheme();
  const { signIn, signInWithGithub, signInWithGoogle, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }
    
    if (!password) {
      setValidationError('Please enter your password');
      return;
    }
    
    setValidationError(null);
    console.log("Attempting sign in with:", email);
    await signIn(email, password);
  };

  return (
    <div className="signin-container">
      <h2 className="title" style={{ color: colors.text }}>Welcome Back</h2>
      <p className="subtitle" style={{ color: colors.textSecondary }}>Sign in to your account</p>
      
      {(error || validationError) && (
        <div 
          className="error-container" 
          style={{ backgroundColor: `${colors.error}20` }}
        >
          <p className="error-text" style={{ color: colors.error }}>{validationError || error}</p>
        </div>
      )}

      <form onSubmit={handleSignIn}>
        <div className="form-group">
          <label htmlFor="email" style={{ color: colors.textSecondary }}>Email</label>
          <div 
            className="input-container" 
            style={{ 
              borderColor: colors.border, 
              backgroundColor: colors.background 
            }}
          >
            <Mail size={20} color={colors.textSecondary} />
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ color: colors.text }}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="password" style={{ color: colors.textSecondary }}>Password</label>
          <div 
            className="input-container" 
            style={{ 
              borderColor: colors.border, 
              backgroundColor: colors.background 
            }}
          >
            <Lock size={20} color={colors.textSecondary} />
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ color: colors.text }}
            />
          </div>
        </div>
        
        <div className="forgot-password-container">
          <button type="button" className="forgot-button" style={{ color: colors.primary }}>
            Forgot Password?
          </button>
        </div>
        
        <button
          type="submit"
          className="signin-button"
          disabled={loading}
          style={{ backgroundColor: colors.primary }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      
      <div className="divider">
        <div className="divider-line" style={{ backgroundColor: colors.border }}></div>
        <span className="divider-text" style={{ color: colors.textSecondary, backgroundColor: colors.surface }}>or continue with</span>
        <div className="divider-line" style={{ backgroundColor: colors.border }}></div>
      </div>
      
      <div className="social-buttons">
        <button
          className="social-button"
          onClick={() => signInWithGithub()}
          type="button"
          style={{ borderColor: colors.border, backgroundColor: colors.background }}
        >
          <Github size={20} color={colors.text} />
          <span style={{ color: colors.text }}>GitHub</span>
        </button>
        
        <button
          className="social-button"
          onClick={() => signInWithGoogle()}
          type="button"
          style={{ borderColor: colors.border, backgroundColor: colors.background }}
        >
          <ToggleLeft size={20} color={colors.text} />
          <span style={{ color: colors.text }}>Google</span>
        </button>
      </div>
      
      <div className="switch-container">
        <p className="switch-text" style={{ color: colors.textSecondary }}>Don't have an account?</p>
        <button onClick={onSwitch} className="switch-button" type="button" style={{ color: colors.primary }}>
          Sign Up
        </button>
      </div>
      
      <style>{`
        .signin-container {
          width: 100%;
        }
        
        .title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 8px;
          text-align: center;
        }
        
        .subtitle {
          font-size: 16px;
          margin-bottom: 24px;
          text-align: center;
        }
        
        .error-container {
          padding: 16px;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        
        .error-text {
          font-size: 14px;
          margin: 0;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
        }
        
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          border-width: 1px;
          border-style: solid;
          border-radius: 12px;
          height: 56px;
          padding: 0 16px;
          overflow: hidden;
        }
        
        .input-container svg {
          margin-right: 12px;
        }
        
        input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          padding: 0;
          font-size: 16px;
          outline: none;
          font-family: inherit;
        }
        
        .forgot-password-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
        }
        
        .forgot-button {
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          font-family: inherit;
          padding: 4px;
        }
        
        .signin-button {
          width: 100%;
          height: 56px;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
          font-family: inherit;
        }
        
        .signin-button:disabled {
          opacity: 0.7;
        }
        
        .signin-button:active {
          transform: scale(0.98);
        }
        
        .divider {
          display: flex;
          align-items: center;
          margin: 32px 0;
          position: relative;
        }
        
        .divider-line {
          flex: 1;
          height: 1px;
        }
        
        .divider-text {
          margin: 0 16px;
          font-size: 14px;
          padding: 0 8px;
        }
        
        .social-buttons {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
        }
        
        .social-button {
          flex: 1;
          height: 56px;
          border-radius: 12px;
          border-width: 1px;
          border-style: solid;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: transform 0.2s, opacity 0.2s;
          font-family: inherit;
        }
        
        .social-button:active {
          transform: scale(0.98);
          opacity: 0.9;
        }
        
        .switch-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .switch-text {
          font-size: 14px;
          margin-right: 4px;
          margin-bottom: 0;
        }
        
        .switch-button {
          font-size: 14px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          font-family: inherit;
          padding: 4px;
        }
        
        @media (max-width: 480px) {
          .title {
            font-size: 24px;
          }
          
          .subtitle {
            font-size: 14px;
          }
          
          .input-container {
            height: 50px;
          }
          
          .signin-button, .social-button {
            height: 50px;
          }
        }
      `}</style>
    </div>
  );
};

export default SignIn;