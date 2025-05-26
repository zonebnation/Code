import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect if user is already logged in
  React.useEffect(() => {
    if (user && !loading) {
      navigate('/editor');
    }
  }, [user, loading, navigate]);

  const handleGetStarted = () => {
    navigate('/onboarding');
  };

  return (
    <div className="landing-page">
      <div className="hero">
        <h1>Code Canvas</h1>
        <p>Your all-in-one coding environment</p>
        <button 
          className="get-started-btn" 
          onClick={handleGetStarted}
        >
          Get Started
        </button>
      </div>

      <div className="features">
        <div className="feature">
          <h2>Code Editor</h2>
          <p>Powerful editor with syntax highlighting and code completion</p>
        </div>
        <div className="feature">
          <h2>File Explorer</h2>
          <p>Manage your projects and files with ease</p>
        </div>
        <div className="feature">
          <h2>Terminal</h2>
          <p>Built-in terminal for running commands</p>
        </div>
        <div className="feature">
          <h2>DevReels</h2>
          <p>Learn from short coding videos</p>
        </div>
      </div>
      
      <style jsx>{`
        .landing-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          background-color: #1E1E1E;
          color: white;
        }
        
        .hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          height: 60vh;
        }
        
        h1 {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        p {
          font-size: 1.2rem;
          margin-bottom: 2rem;
        }
        
        .get-started-btn {
          background-color: #3794FF;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .get-started-btn:hover {
          background-color: #2d7ad3;
        }
        
        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          width: 100%;
          max-width: 1200px;
          margin-top: 2rem;
        }
        
        .feature {
          background-color: #252526;
          padding: 1.5rem;
          border-radius: 8px;
        }
        
        .feature h2 {
          font-size: 1.5rem;
          margin-bottom: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;