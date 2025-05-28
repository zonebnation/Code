import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SharingService from '../../services/SharingService';
import { Project, File } from '../../types/editor';
import { 
  X, 
  Link, 
  Globe, 
  Lock, 
  Calendar, 
  Download, 
  Copy, 
  CheckCircle, 
  ClipboardCopy, 
  File as FileIcon, 
  FolderOpen 
} from 'lucide-react';

// Define ShareOptions interface since it's missing from the service
interface ShareOptions {
  type: 'link' | 'public' | 'private';
  password?: string;
  expiresAt?: Date;
  allowDownload?: boolean;
  allowCopy?: boolean;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project;
  file?: File;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  file
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [shareType, setShareType] = useState<'link' | 'public' | 'private'>('link');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [useExpiry, setUseExpiry] = useState(false);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowCopy, setAllowCopy] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShareType('link');
      setPassword('');
      setUsePassword(false);
      setExpiryDays(7);
      setUseExpiry(false);
      setAllowDownload(true);
      setAllowCopy(true);
      setShareUrl(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen]);
  
  // Mock implementation for handling share
  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    
    try {
      const options: ShareOptions = {
        type: shareType,
        allowDownload,
        allowCopy
      };
      
      // Add optional parameters
      if (usePassword && password) {
        options.password = password;
      }
      
      if (useExpiry && expiryDays > 0) {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + expiryDays);
        options.expiresAt = expiryDate;
      }
      
      let response: { success: boolean; url?: string; error?: string };
      
      // Mock implementation for sharing
      if (project && !file) {
        // Mock share project
        response = {
          success: true,
          url: `https://example.com/share/project/${project.id}`
        };
      } else if (file) {
        // Mock share file
        response = {
          success: true,
          url: `https://example.com/share/file/${file.id}`
        };
      } else {
        throw new Error('No project or file selected for sharing');
      }
      
      if (response.success && response.url) {
        setShareUrl(response.url);
      } else {
        setError(response.error || 'Failed to generate share link');
      }
    } catch (error: any) {
      console.error('Error sharing:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Mock implementation for sharing as ZIP
  const handleShareAsZip = async () => {
    if (!project) return;
    
    setIsSharing(true);
    setError(null);
    
    try {
      // Mock implementation for sharing as ZIP
      const response = {
        success: true,
        url: `https://example.com/share/zip/${project.id}`
      };
      
      if (response.success) {
        if (response.url) {
          setShareUrl(response.url);
        } else {
          setError('Project exported successfully');
        }
      } else {
        setError('Failed to share as ZIP');
      }
    } catch (error: any) {
      console.error('Error sharing as ZIP:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSharing(false);
    }
  };
  
  // Handle export
  const handleExport = async () => {
    if (project && !file) {
      // Export project
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } else if (file) {
      // Export file
      const blob = new Blob([file.content || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    }
  };
  
  // Copy URL to clipboard
  const copyToClipboard = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      setError('Failed to copy URL to clipboard');
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        style={{ backgroundColor: colors.surface }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            {file ? (
              <FileIcon size={20} color={colors.primary} />
            ) : (
              <FolderOpen size={20} color={colors.primary} />
            )}
            <h2 className="text-lg font-semibold" style={{ color: colors.text }}>
              {shareUrl ? 'Share Link' : `Share ${file ? 'File' : 'Project'}`}
            </h2>
          </div>
          <button 
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} color={colors.textSecondary} />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4">
          {error && (
            <div 
              className="mb-4 p-3 rounded-md"
              style={{ backgroundColor: `${colors.error}15`, color: colors.error }}
            >
              {error}
            </div>
          )}
          
          {!shareUrl ? (
            <>
              {/* Share type options */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Share Type
                </label>
                <div className="flex gap-2">
                  <button
                    className={`flex-1 p-2 rounded-md border flex items-center justify-center gap-2 ${shareType === 'link' ? 'border-blue-500' : 'border-gray-300'}`}
                    onClick={() => setShareType('link')}
                    style={{ 
                      borderColor: shareType === 'link' ? colors.primary : colors.border,
                      backgroundColor: shareType === 'link' ? `${colors.primary}10` : 'transparent'
                    }}
                  >
                    <Link size={16} color={shareType === 'link' ? colors.primary : colors.textSecondary} />
                    <span style={{ color: shareType === 'link' ? colors.primary : colors.text }}>Link</span>
                  </button>
                  
                  <button
                    className={`flex-1 p-2 rounded-md border flex items-center justify-center gap-2 ${shareType === 'public' ? 'border-blue-500' : 'border-gray-300'}`}
                    onClick={() => setShareType('public')}
                    style={{ 
                      borderColor: shareType === 'public' ? colors.primary : colors.border,
                      backgroundColor: shareType === 'public' ? `${colors.primary}10` : 'transparent'
                    }}
                  >
                    <Globe size={16} color={shareType === 'public' ? colors.primary : colors.textSecondary} />
                    <span style={{ color: shareType === 'public' ? colors.primary : colors.text }}>Public</span>
                  </button>
                  
                  <button
                    className={`flex-1 p-2 rounded-md border flex items-center justify-center gap-2 ${shareType === 'private' ? 'border-blue-500' : 'border-gray-300'}`}
                    onClick={() => setShareType('private')}
                    style={{ 
                      borderColor: shareType === 'private' ? colors.primary : colors.border,
                      backgroundColor: shareType === 'private' ? `${colors.primary}10` : 'transparent'
                    }}
                  >
                    <Lock size={16} color={shareType === 'private' ? colors.primary : colors.textSecondary} />
                    <span style={{ color: shareType === 'private' ? colors.primary : colors.text }}>Private</span>
                  </button>
                </div>
              </div>
              
              {/* Password protection */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: colors.text }}>
                    Password Protection
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox" 
                      checked={usePassword}
                      onChange={(e) => setUsePassword(e.target.checked)}
                    />
                    <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>Enable</span>
                  </label>
                </div>
                
                {usePassword && (
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full p-2 border rounded-md"
                    style={{ 
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.border
                    }}
                  />
                )}
              </div>
              
              {/* Expiry date */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: colors.text }}>
                    Expiry Date
                  </label>
                  <label className="inline-flex items-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox" 
                      checked={useExpiry}
                      onChange={(e) => setUseExpiry(e.target.checked)}
                    />
                    <span className="ml-2 text-sm" style={{ color: colors.textSecondary }}>Enable</span>
                  </label>
                </div>
                
                {useExpiry && (
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(parseInt(e.target.value))}
                      className="w-20 p-2 border rounded-md mr-2"
                      style={{ 
                        backgroundColor: colors.background,
                        color: colors.text,
                        borderColor: colors.border
                      }}
                    />
                    <span style={{ color: colors.text }}>days from now</span>
                  </div>
                )}
              </div>
              
              {/* Permissions */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                  Permissions
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox" 
                      checked={allowDownload}
                      onChange={(e) => setAllowDownload(e.target.checked)}
                    />
                    <span className="ml-2" style={{ color: colors.text }}>Allow downloading</span>
                  </label>
                  <label className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="form-checkbox" 
                      checked={allowCopy}
                      onChange={(e) => setAllowCopy(e.target.checked)}
                    />
                    <span className="ml-2" style={{ color: colors.text }}>Allow copying code</span>
                  </label>
                </div>
              </div>
              
              <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
                <div className="grid grid-cols-2 gap-3">
                  {!user && (
                    <div 
                      className="col-span-2 mb-3 p-2 rounded text-sm"
                      style={{ backgroundColor: `${colors.warning}15`, color: colors.warning }}
                    >
                      Sign in to enable online sharing. You can still export files.
                    </div>
                  )}
                  
                  <button
                    className="p-2 border rounded-md flex flex-col items-center justify-center gap-1"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text
                    }}
                    onClick={handleExport}
                  >
                    <Download size={18} color={colors.primary} />
                    <span>Export</span>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Save to device</span>
                  </button>
                  
                  <button
                    className="p-2 border rounded-md flex flex-col items-center justify-center gap-1"
                    style={{ 
                      borderColor: colors.border,
                      color: colors.text,
                      opacity: user ? 1 : 0.5
                    }}
                    onClick={project ? handleShareAsZip : handleShare}
                    disabled={!user || isSharing}
                  >
                    <ClipboardCopy size={18} color={colors.primary} />
                    <span>{isSharing ? 'Sharing...' : 'Share Online'}</span>
                    <span className="text-xs" style={{ color: colors.textSecondary }}>Generate link</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            // Show share link
            <div className="pt-2">
              <label className="block text-sm font-medium mb-2" style={{ color: colors.text }}>
                Share Link
              </label>
              
              <div className="flex items-center mb-4">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 p-2 border rounded-l-md"
                  style={{ 
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border
                  }}
                />
                <button 
                  className="p-2 border-t border-r border-b rounded-r-md"
                  onClick={copyToClipboard}
                  style={{ 
                    backgroundColor: copied ? colors.success : colors.primary,
                    borderColor: copied ? colors.success : colors.primary,
                    color: 'white'
                  }}
                >
                  {copied ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Copy size={20} />
                  )}
                </button>
              </div>
              
              <div 
                className="p-3 rounded-md mb-4"
                style={{ backgroundColor: `${colors.primary}10`, color: colors.text }}
              >
                <p className="mb-2 text-sm">Share Options:</p>
                <ul className="text-sm space-y-1 ml-5 list-disc" style={{ color: colors.textSecondary }}>
                  <li>Share Type: <span style={{ color: colors.text }}>{shareType}</span></li>
                  {usePassword && <li>Password Protected</li>}
                  {useExpiry && <li>Expires in {expiryDays} days</li>}
                  <li>Download: <span style={{ color: colors.text }}>{allowDownload ? 'Allowed' : 'Not allowed'}</span></li>
                  <li>Copy code: <span style={{ color: colors.text }}>{allowCopy ? 'Allowed' : 'Not allowed'}</span></li>
                </ul>
              </div>
              
              <div className="flex justify-between">
                <button
                  className="p-2 border rounded-md"
                  onClick={() => setShareUrl(null)}
                  style={{ 
                    borderColor: colors.border,
                    color: colors.text
                  }}
                >
                  Change Options
                </button>
                
                <button
                  className="p-2 rounded-md"
                  onClick={copyToClipboard}
                  style={{ 
                    backgroundColor: copied ? colors.success : colors.primary,
                    color: 'white'
                  }}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;