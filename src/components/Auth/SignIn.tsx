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
    <div className="signin-form">
      <h2 className="title" style={{ color: colors.text }}>Welcome Back</h2>
      <p className="subtitle" style={{ color: colors.textSecondary }}>Sign in to your account</p>
      
      {(error || validationError) && (
        <div className="error-container" style={{ backgroundColor: `${colors.error}20` }}>
          <p className="error-text" style={{ color: colors.error }}>{validationError || error}</p>
        </div>
      )}

      <form onSubmit={handleSignIn}>
        <div className="input-group">
          <label htmlFor="email" style={{ color: colors.textSecondary }}>Email</label>
          <div className="input-container" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            <Mail size={20} color={colors.textSecondary} className="input-icon" />
            <input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              style={{ color: colors.text }}
            />
          </div>
        </div>
        
        <div className="input-group">
          <label htmlFor="password" style={{ color: colors.textSecondary }}>Password</label>
          <div className="input-container" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            <Lock size={20} color={colors.textSecondary} className="input-icon" />
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
        
        <button type="button" className="forgot-password" style={{ color: colors.primary }}>
          Forgot Password?
        </button>
        
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
        <span className="divider-text" style={{ color: colors.textSecondary }}>or continue with</span>
        <div className="divider-line" style={{ backgroundColor: colors.border }}></div>
      </div>
      
      <div className="social-buttons">
        <button
          className="social-button"
          onClick={() => signInWithGithub()}
          type="button"
          style={{ borderColor: colors.border, backgroundColor: colors.background, color: colors.text }}
        >
          <Github size={20} />
        </button>
        
        <button
          className="social-button"
          onClick={() => signInWithGoogle()}
          type="button"
          style={{ borderColor: colors.border, backgroundColor: colors.background, color: colors.text }}
        >
          <ToggleLeft size={20} />
        </button>
      </div>
      
      <div className="switch-container">
        <p className="switch-text" style={{ color: colors.textSecondary }}>Don't have an account?</p>
        <button onClick={onSwitch} className="switch-button" type="button" style={{ color: colors.primary }}>
          Sign Up
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .signin-form {
          width: 100%;
        }
        
        .title {
          font-size: 24px;
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
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 16px;
        }
        
        .error-text {
          font-size: 14px;
        }
        
        .input-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          font-size: 14px;
          margin-bottom: 6px;
        }
        
        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          border-width: 1px;
          border-style: solid;
          border-radius: 8px;
          height: 48px;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
        }
        
        input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          padding: 0 12px 0 40px;
          font-size: 16px;
          outline: none;
        }
        
        .forgot-password {
          font-size: 14px;
          text-align: right;
          background: none;
          border: none;
          cursor: pointer;
          margin-left: auto;
          display: block;
          margin-bottom: 16px;
        }
        
        .signin-button {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .signin-button:disabled {
          opacity: 0.7;
        }
        
        .divider {
          display: flex;
          align-items: center;
          margin: 24px 0;
        }
        
        .divider-line {
          flex: 1;
          height: 1px;
        }
        
        .divider-text {
          margin: 0 16px;
          font-size: 14px;
        }
        
        .social-buttons {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }
        
        .social-button {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          border-width: 1px;
          border-style: solid;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 8px;
          cursor: pointer;
        }
        
        .switch-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .switch-text {
          font-size: 14px;
          margin-right: 4px;
        }
        
        .switch-button {
          font-size: 14px;
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
        }
      `}} />
    </div>
  );
};

export default SignIn;