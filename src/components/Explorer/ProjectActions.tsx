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

const ProjectActions: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject, createNewFile, createNewFolder } = useProject();
  const [isActionsVisible, setIsActionsVisible] = useState(false);
  const [modalType, setModalType] = useState<'file' | 'folder' | null>(null);
  const [name, setName] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const toggleActions = () => {
    setIsActionsVisible(!isActionsVisible);
  };
  
  const showNewFileModal = () => {
    setModalType('file');
    setName('');
    setIsActionsVisible(false);
  };
  
  const showNewFolderModal = () => {
    setModalType('folder');
    setName('');
    setIsActionsVisible(false);
  };
  
  const closeModal = () => {
    setModalType(null);
  };

  const handleExportProject = async () => {
    if (!currentProject) return;
    
    try {
      const success = await SharingService.exportProject(currentProject);
      if (!success) {
        alert('Failed to export project');
      }
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project');
    }
    
    setIsActionsVisible(false);
  };
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    
    try {
      if (modalType === 'file') {
        await createNewFile(name);
      } else if (modalType === 'folder') {
        await createNewFolder(name);
      }
      closeModal();
    } catch (error) {
      console.error(`Error creating ${modalType}:`, error);
      alert(`Failed to create ${modalType}. Please try again.`);
    }
  };
  
  if (!currentProject) return null;
  
  return (
    <>
      <div className="container" style={{ backgroundColor: colors.surface }}>
        <button
          className="mainButton"
          style={{ backgroundColor: colors.primary }}
          onClick={toggleActions}
          aria-label="Create new file or folder"
        >
          <Plus size={24} color="#FFFFFF" />
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
              >
                Cancel
              </button>
              
              <button
                className="button createButton"
                style={{ backgroundColor: colors.primary, color: '#FFFFFF' }}
                onClick={handleCreate}
                disabled={!name.trim()}
              >
                Create
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

      <style jsx>{`
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
          width: 48px;
          height: 48px;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          border: none;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .mainButton:hover {
          transform: scale(1.05);
        }
        
        .actionsMenu {
          position: absolute;
          bottom: 60px;
          right: 0;
          border-radius: 8px;
          border-width: 1px;
          border-style: solid;
          padding: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .actionItem {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 8px 12px;
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          min-width: 180px;
        }
        
        .actionItem:hover {
          background-color: rgba(0, 0, 0, 0.05);
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
          border-radius: 8px;
          border: 1px solid;
          padding: 16px;
          animation: zoomIn 0.2s ease;
        }
        
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
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
          font-size: 18px;
        }
        
        .closeButton {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .input {
          width: 100%;
          height: 40px;
          border: 1px solid;
          border-radius: 4px;
          padding: 0 12px;
          margin-bottom: 20px;
          font-size: 14px;
        }
        
        .input:focus {
          outline: none;
          border-color: ${colors.primary};
        }
        
        .modalActions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          min-height: 36px;
          transition: opacity 0.2s ease;
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
            min-height: 44px;
            padding: 10px 16px;
          }
        }
      `}</style>
    </>
  );
};

export default ProjectActions;