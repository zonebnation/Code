import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { 
  Plus, 
  FileText, 
  Folder, 
  X,
  Share2,
  Download
} from 'lucide-react';
import ShareModal from '../Sharing/ShareModal';
import SharingService from '../../services/SharingService';
import { useNavigate } from 'react-router-dom';

const ProjectActions: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject, createNewFile, createNewFolder } = useProject();
  const navigate = useNavigate();
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'folder' | null>(null);
  const [name, setName] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const toggleActions = () => {
    setIsActionsVisible(!isActionsVisible);
  };
  
  const showNewFileModal = () => {
    setModalType('file');
    setName('');
    setErrorMessage(null);
    setIsActionsVisible(false);
  };
  
  const showNewFolderModal = () => {
    setModalType('folder');
    setName('');
    setErrorMessage(null);
    setIsActionsVisible(false);
  };
  
  const closeModal = () => {
    setModalType(null);
    setErrorMessage(null);
  };

  const handleExportProject = async () => {
    if (!currentProject) return;
    
    try {
      // In this version, we'll handle project export locally since SharingService.exportProject doesn't exist
      const blob = new Blob([JSON.stringify(currentProject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentProject.name}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project');
    }
    
    setIsActionsVisible(false);
  };
  
  const handleCreate = async () => {
    if (!name.trim()) {
      setErrorMessage('Name cannot be empty');
      return;
    }
    
    setIsCreating(true);
    setErrorMessage(null);
    
    try {
      if (modalType === 'file') {
        await createNewFile(name);
      } else if (modalType === 'folder') {
        await createNewFolder(name);
      }
      closeModal();
      
      // If this was a new file, navigate to editor
      if (modalType === 'file') {
        navigate('/editor');
      }
    } catch (error: any) {
      console.error(`Error creating ${modalType}:`, error);
      setErrorMessage(error.message || `Failed to create ${modalType}. Please try again.`);
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleQuickCreate = async () => {
    if (!currentProject) return;
    
    try {
      setIsCreating(true);
      // Create a file with default name
      const defaultName = `file${Math.floor(Math.random() * 10000)}.js`;
      await createNewFile(defaultName);
      navigate('/editor');
    } catch (error) {
      console.error('Error creating file:', error);
      alert('Failed to create file. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  if (!currentProject) return null;
  
  return (
    <>
      <div className="container" style={{ backgroundColor: colors.surface }}>
        <button
          className="mainButton"
          style={{ backgroundColor: colors.primary }}
          onClick={isCreating ? undefined : toggleActions}
          aria-label="Create new file or folder"
          disabled={isCreating}
        >
          {isCreating ? (
            <span className="loading-spinner"></span>
          ) : (
            <Plus size={24} color="#FFFFFF" />
          )}
        </button>
        
        {isActionsVisible && (
          <div 
            className="actionsMenu"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <button
              className="actionItem"
              onClick={showNewFileModal}
            >
              <FileText size={18} color={colors.text} className="actionIcon" />
              <span 
                className="actionText"
                style={{ color: colors.text }}
              >
                New File
              </span>
            </button>
            
            <button
              className="actionItem"
              onClick={showNewFolderModal}
            >
              <Folder size={18} color={colors.text} className="actionIcon" />
              <span 
                className="actionText"
                style={{ color: colors.text }}
              >
                New Folder
              </span>
            </button>

            <button
              className="actionItem"
              onClick={() => {
                setIsActionsVisible(false);
                setIsShareModalOpen(true);
              }}
            >
              <Share2 size={18} color={colors.text} className="actionIcon" />
              <span 
                className="actionText"
                style={{ color: colors.text }}
              >
                Share Project
              </span>
            </button>

            <button
              className="actionItem"
              onClick={handleExportProject}
            >
              <Download size={18} color={colors.text} className="actionIcon" />
              <span 
                className="actionText"
                style={{ color: colors.text }}
              >
                Export Project
              </span>
            </button>
          </div>
        )}
      </div>
      
      {modalType !== null && (
        <div className="modalOverlay">
          <div 
            className="modalContent"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <div className="modalHeader">
              <h3 
                className="modalTitle"
                style={{ color: colors.text }}
              >
                {modalType === 'file' ? 'New File' : 'New Folder'}
              </h3>
              <button 
                className="closeButton"
                onClick={closeModal}
              >
                <X size={20} color={colors.textSecondary} />
              </button>
            </div>
            
            {errorMessage && (
              <div 
                style={{
                  margin: '0 0 16px 0',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: `${colors.error}15`,
                  color: colors.error
                }}
              >
                {errorMessage}
              </div>
            )}
            
            <input
              className="input"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              }}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={modalType === 'file' ? 'Filename' : 'Folder name'}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
            
            <div className="modalActions">
              <button
                className="button cancelButton"
                style={{ borderColor: colors.border, color: colors.text }}
                onClick={closeModal}
                disabled={isCreating}
              >
                Cancel
              </button>
              
              <button
                className="button createButton"
                style={{ 
                  backgroundColor: colors.primary, 
                  color: '#FFFFFF',
                  opacity: !name.trim() || isCreating ? 0.7 : 1
                }}
                onClick={handleCreate}
                disabled={!name.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={currentProject}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .container {
          position: absolute;
          bottom: 16px;
          right: 16px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          z-index: 50;
        }
        
        .mainButton {
          width: 56px;
          height: 56px;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .mainButton:hover {
          transform: scale(1.05);
        }
        
        .mainButton:active {
          transform: scale(0.98);
        }
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .actionsMenu {
          position: absolute;
          bottom: 70px;
          right: 0;
          border-radius: 12px;
          border-width: 1px;
          border-style: solid;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.2s ease;
          min-width: 180px;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .actionItem {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 12px;
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          border-radius: 8px;
          transition: background-color 0.2s ease;
          min-height: 44px;
        }
        
        .actionItem:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .actionItem:active {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .actionIcon {
          margin-right: 12px;
        }
        
        .actionText {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          white-space: nowrap;
        }
        
        .modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        
        .modalContent {
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          border: 1px solid;
          padding: 24px;
          animation: zoomIn 0.2s ease;
        }
        
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        
        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .modalTitle {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
        }
        
        .closeButton {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 16px;
          transition: background-color 0.2s;
        }
        
        .closeButton:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .input {
          width: 100%;
          height: 50px;
          border: 1px solid;
          border-radius: 12px;
          padding: 0 16px;
          margin-bottom: 24px;
          font-size: 16px;
          font-family: inherit;
        }
        
        .input:focus {
          outline: none;
          border-color: ${colors.primary};
        }
        
        .modalActions {
          display: flex;
          justify-content: flex-end;
        }
        
        .button {
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          min-height: 44px;
          transition: opacity 0.2s ease;
          min-width: 100px;
          font-family: inherit;
        }
        
        .cancelButton {
          background: transparent;
          border: 1px solid;
        }
        
        .createButton {
          border: none;
        }
        
        .createButton:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        @media (max-width: 768px) {
          .button {
            min-height: 48px; /* Larger touch targets on mobile */
            padding: 10px 16px;
          }
          
          .modalContent {
            max-width: 340px;
          }
        }
        
        /* Fix for notched phones */
        @supports (padding: max(0px)) {
          .container {
            bottom: max(16px, env(safe-area-inset-bottom, 16px));
            right: max(16px, env(safe-area-inset-right, 16px));
          }
        }
      `}} />
    </>
  );
};

export default ProjectActions;