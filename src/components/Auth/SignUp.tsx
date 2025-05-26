import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Lock, Github, ToggleLeft } from 'lucide-react';

interface SignUpProps {
  onSwitch: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSwitch }) => {
  const { colors } = useTheme();
  const { signUp, signInWithGithub, signInWithGoogle, loading, error } = useAuth();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username.trim()) {
      setValidationError('Please enter a username');
      return;
    }
    
    if (!email.trim()) {
      setValidationError('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    
    setValidationError(null);
    await signUp(email, password, username);
  };

  return (
    <div className="signup-form">
      <h2 className="title" style={{ color: colors.text }}>Create Account</h2>
      <p className="subtitle" style={{ color: colors.textSecondary }}>Join Code Canvas today</p>
      
      {(error || validationError) && (
        <div className="error-container" style={{ backgroundColor: `${colors.error}20` }}>
          <p className="error-text" style={{ color: colors.error }}>{validationError || error}</p>
        </div>
      )}

      <form onSubmit={handleSignUp}>
        <div className="input-group">
          <label htmlFor="username" style={{ color: colors.textSecondary }}>Username</label>
          <div className="input-container" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            <User size={20} color={colors.textSecondary} className="input-icon" />
            <input
              id="username"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ color: colors.text }}
            />
          </div>
        </div>
        
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
        
        <div className="input-group">
          <label htmlFor="confirmPassword" style={{ color: colors.textSecondary }}>Confirm Password</label>
          <div className="input-container" style={{ borderColor: colors.border, backgroundColor: colors.background }}>
            <Lock size={20} color={colors.textSecondary} className="input-icon" />
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ color: colors.text }}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="signup-button"
          disabled={loading}
          style={{ backgroundColor: colors.primary }}
        >
          {loading ? 'Creating Account...' : 'Create Account'}
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
        <p className="switch-text" style={{ color: colors.textSecondary }}>Already have an account?</p>
        <button onClick={onSwitch} className="switch-button" type="button" style={{ color: colors.primary }}>
          Sign In
        </button>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .signup-form {
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
        
        .signup-button {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 8px;
        }
        
        .signup-button:disabled {
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

export default SignUp;