import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProjectProvider } from './context/ProjectContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import EditorScreen from './screens/EditorScreen';
import ExplorerScreen from './screens/ExplorerScreen';
import TerminalScreen from './screens/TerminalScreen';
import SettingsScreen from './screens/SettingsScreen';
import SearchScreen from './screens/SearchScreen';
import VideosScreen from './screens/VideosScreen';
import NotFoundScreen from './screens/NotFoundScreen';
import AuthScreen from './screens/AuthScreen';
import LandingPage from './screens/LandingPage';
import OnboardingScreen from './screens/OnboardingScreen';
import CollaborationScreen from './screens/CollaborationScreen'; 
import SharedItemsScreen from './screens/SharedItemsScreen'; 
import SharedContentScreen from './screens/SharedContentScreen'; 
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { useAuth } from './context/AuthContext';

// Component to handle authentication callback
function AuthCallback() {
  const { user, loading, refreshSession } = useAuth();
  const [processingCallback, setProcessingCallback] = useState(true);
  
  // On mount, ensure session is refreshed
  useEffect(() => {
    const processCallback = async () => {
      console.log("Auth callback component - Initial state:", { 
        user: user ? "exists" : "null", 
        loading 
      });
      
      try {
        if (!user && !loading) {
          console.log("Attempting to refresh session in callback");
          await refreshSession();
        }
      } catch (err) {
        console.error("Error processing callback:", err);
      } finally {
        // Wait a bit to ensure any auth state updates have happened
        setTimeout(() => {
          setProcessingCallback(false);
        }, 500);
      }
    };
    
    processCallback();
  }, []);

  // While processing or loading, show spinner
  if (loading || processingCallback) {
    return (
      <div style={{ 
        padding: '20px', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF'
      }}>
        <div style={{
          border: '4px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '50%',
          borderTop: '4px solid #3794FF',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p style={{ marginTop: '20px' }}>Processing login...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect based on authentication state
  console.log("Auth callback complete, redirecting to:", user ? "/editor" : "/auth");
  return <Navigate to={user ? "/editor" : "/auth"} replace />;
}

function AppRoutes() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Set up global error handler
    const handleError = (error: ErrorEvent) => {
      console.error('Global error:', error);
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#1E1E1E',
        color: '#FFFFFF',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <h2>Something went wrong</h2>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '8px 16px',
            backgroundColor: '#3794FF',
            border: 'none',
            borderRadius: '4px',
            color: 'white',
            cursor: 'pointer'
          }}
        >
          Reload App
        </button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />
      <Route path="/auth" element={<AuthScreen />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      
      {/* Shared content routes - publicly accessible */}
      <Route path="/share/:type/:id" element={<SharedContentScreen />} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/editor" replace />} />
        <Route path="editor" element={<EditorScreen />} />
        <Route path="explorer" element={<ExplorerScreen />} />
        <Route path="terminal" element={<TerminalScreen />} />
        <Route path="videos" element={<VideosScreen />} />
        <Route path="collaboration" element={<CollaborationScreen />} />
        <Route path="shared" element={<SharedItemsScreen />} />
        <Route path="settings/*" element={<SettingsScreen />} />
        <Route path="search" element={<SearchScreen />} />
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AuthProvider>
          <ProjectProvider>
            <Router>
              <AppRoutes />
            </Router>
          </ProjectProvider>
        </AuthProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;