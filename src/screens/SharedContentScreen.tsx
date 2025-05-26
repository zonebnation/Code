import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useParams, useNavigate } from 'react-router-dom';
import SharingService, { SharedEntity } from '../services/SharingService';
import { useProject } from '../context/ProjectContext';
import CodeEditor from '../components/Editor/CodeEditor';
import MonacoEditor from '../components/Editor/MonacoEditor';
import { 
  File as FileIcon, 
  FolderOpen, 
  Eye, 
  Download, 
  Copy, 
  Lock, 
  ChevronLeft, 
  Calendar, 
  User, 
  AlertCircle 
} from 'lucide-react';
import { detectLanguage } from '../utils/languageDetection';

const SharedContentScreen: React.FC = () => {
  const { colors } = useTheme();
  const { id, type } = useParams<{ id: string; type: string }>();
  const navigate = useNavigate();
  const { projects, openProject } = useProject();
  
  const [sharedEntity, setSharedEntity] = useState<SharedEntity | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [entityName, setEntityName] = useState<string>('Shared Item');
  const [language, setLanguage] = useState<string>('plaintext');
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadSharedEntity();
    }
  }, [id]);
  
  const loadSharedEntity = async (password?: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const entity = await SharingService.getSharedEntity(id, password);
      
      if (!entity) {
        setError('Shared item not found or has expired');
        setLoading(false);
        return;
      }
      
      setSharedEntity(entity);
      
      // Check if password protection is needed
      if (entity.password && !password) {
        setShowPasswordPrompt(true);
        setLoading(false);
        return;
      }
      
      // Load content based on entity type
      if (entity.entityType === 'file') {
        await loadFileContent(entity.entityId);
      } else if (entity.entityType === 'project') {
        await loadProjectContent(entity.entityId);
      }
    } catch (error: any) {
      console.error('Error loading shared entity:', error);
      setError(error.message || 'Failed to load shared content');
    } finally {
      setLoading(false);
    }
  };
  
  const loadFileContent = async (fileId: string) => {
    // In a real implementation, you would fetch the file content from the API
    // For now, we'll just look for it in the current projects
    let fileContent = '';
    let fileName = 'Shared File';
    
    // Search all projects for the file
    for (const project of projects) {
      const file = project.files.find(f => f.id === fileId);
      if (file && file.type === 'file') {
        fileContent = file.content || '';
        fileName = file.name;
        setLanguage(detectLanguage(file.name));
        break;
      }
    }
    
    setContent(fileContent);
    setEntityName(fileName);
  };
  
  const loadProjectContent = async (projectId: string) => {
    // In a real implementation, you would fetch the project from the API
    // For now, we'll just look for it in the current projects
    const project = projects.find(p => p.id === projectId);
    
    if (project) {
      setEntityName(project.name);
      // Open the project
      openProject(project);
      
      // Navigate to editor
      navigate('/editor');
    } else {
      setError('Project not found');
    }
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadSharedEntity(password);
  };
  
  const handleCopyContent = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      
      // Reset copy state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy content:', error);
      setError('Failed to copy content to clipboard');
    }
  };
  
  const handleDownload = () => {
    if (!content || !sharedEntity) return;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entityName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Show password prompt if needed
  if (showPasswordPrompt) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-full max-w-md p-6 rounded-lg shadow-lg"
          style={{ backgroundColor: colors.surface }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock size={24} color={colors.warning} />
            <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
              Password Protected
            </h1>
          </div>
          
          <p className="mb-4" style={{ color: colors.textSecondary }}>
            This shared content is password protected. Please enter the password to access it.
          </p>
          
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full p-2 mb-4 border rounded-md"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }}
              required
            />
            
            {error && (
              <div 
                className="p-2 mb-4 rounded-md"
                style={{ backgroundColor: `${colors.error}15`, color: colors.error }}
              >
                {error}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full p-2 rounded-md"
              style={{ backgroundColor: colors.primary, color: 'white' }}
              disabled={loading}
            >
              {loading ? 'Checking...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: colors.background }}
      >
        <div className="animate-spin mb-4">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
              style={{ color: colors.border }}
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              style={{ color: colors.primary }}
            />
          </svg>
        </div>
        <p style={{ color: colors.textSecondary }}>Loading shared content...</p>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-full max-w-md p-6 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: colors.surface }}
        >
          <AlertCircle size={48} color={colors.error} className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Error
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md"
            style={{ backgroundColor: colors.primary, color: 'white' }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  if (!sharedEntity) {
    return (
      <div 
        className="min-h-screen flex flex-col items-center justify-center p-4"
        style={{ backgroundColor: colors.background }}
      >
        <div
          className="w-full max-w-md p-6 rounded-lg shadow-lg text-center"
          style={{ backgroundColor: colors.surface }}
        >
          <AlertCircle size={48} color={colors.warning} className="mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2" style={{ color: colors.text }}>
            Not Found
          </h1>
          <p className="mb-6" style={{ color: colors.textSecondary }}>
            The shared content you're looking for doesn't exist or has expired.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-md"
            style={{ backgroundColor: colors.primary, color: 'white' }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }
  
  // Display shared file content
  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        <div className="flex items-center">
          <button
            className="mr-4"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <ChevronLeft size={20} color={colors.primary} />
          </button>
          
          <div className="flex items-center gap-2">
            {sharedEntity.entityType === 'file' ? (
              <FileIcon size={20} color={colors.primary} />
            ) : (
              <FolderOpen size={20} color={colors.primary} />
            )}
            <h1 className="text-lg font-semibold" style={{ color: colors.text }}>
              {entityName}
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-1 text-sm"
            style={{ color: colors.textSecondary }}
          >
            <Eye size={16} />
            <span>{sharedEntity.accessCount} views</span>
          </div>
          
          {sharedEntity.allowCopy && (
            <button
              className="p-2 rounded-md"
              onClick={handleCopyContent}
              disabled={!content}
              title="Copy content"
              style={{ 
                backgroundColor: copied ? colors.success : colors.surface,
                color: copied ? 'white' : colors.text,
                border: `1px solid ${copied ? colors.success : colors.border}`
              }}
            >
              <Copy size={18} />
            </button>
          )}
          
          {sharedEntity.allowDownload && (
            <button
              className="p-2 rounded-md"
              onClick={handleDownload}
              disabled={!content}
              title="Download"
              style={{ 
                backgroundColor: colors.surface,
                color: colors.text,
                border: `1px solid ${colors.border}`
              }}
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Info bar */}
      <div 
        className="flex flex-wrap gap-4 p-2 text-sm border-b"
        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }}
      >
        <div className="flex items-center gap-1">
          <User size={14} />
          <span>Shared by: {sharedEntity.userId}</span>
        </div>
        
        {sharedEntity.expiresAt && (
          <div className="flex items-center gap-1">
            <Calendar size={14} />
            <span>Expires: {new Date(sharedEntity.expiresAt).toLocaleDateString()}</span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1">
        {content && sharedEntity.entityType === 'file' && (
          <div className="h-full">
            {useMonacoEditor ? (
              <MonacoEditor 
                code={content}
                language={language}
                onChange={() => {}} // Read-only
                readOnly={true}
              />
            ) : (
              <CodeEditor
                code={content}
                language={language}
                onChange={() => {}} // Read-only
                readOnly={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Decide which editor to use based on device capabilities
const useMonacoEditor = window.innerWidth > 768;

export default SharedContentScreen;