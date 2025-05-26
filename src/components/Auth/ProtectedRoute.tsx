import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, refreshSession } = useAuth();
  const location = useLocation();
  const [internalLoading, setInternalLoading] = useState(true);
  
  // Debug authentication state
  useEffect(() => {
    console.log("ProtectedRoute - Auth state:", { user: user?.id, loading, path: location.pathname });
  }, [user, loading, location]);
  
  // Try to refresh session on mount
  useEffect(() => {
    const attemptRefresh = async () => {
      if (!user && !loading) {
        console.log("Attempting to refresh session");
        await refreshSession();
      }
    };
    
    attemptRefresh();
  }, []);
  
  // Ensure we don't get stuck in loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalLoading) {
        console.log("Force ending loading state after timeout");
        setInternalLoading(false);
      }
    }, 3000); // 3 seconds max loading time
    
    return () => clearTimeout(timer);
  }, [internalLoading]);
  
  // Update internal loading when auth state changes
  useEffect(() => {
    if (!loading) {
      // Small delay to ensure state is fully updated
      const timer = setTimeout(() => {
        setInternalLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Show loading spinner only during initial load
  if (loading && internalLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading application...</p>
        <style dangerouslySetInnerHTML={{__html: `
          .loading-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100vw;
            background-color: #1E1E1E;
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

  // If not authenticated, redirect to auth page
  if (!user) {
    console.log("Not authenticated, redirecting to /auth");
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;