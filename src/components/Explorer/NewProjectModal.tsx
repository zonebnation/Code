import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import TemplateService, { ProjectTemplate } from '../../services/TemplateService';
import TemplateSelector from '../ProjectTemplate/TemplateSelector';
import { X, FolderPlus, Plus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (name: string, template?: string) => Promise<void>;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject
}) => {
  const { colors } = useTheme();
  const [projectName, setProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>(undefined);
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  
  if (!isOpen) return null;
  
  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError('Project name is required');
      return;
    }
    
    setError(null);
    setIsCreating(true);
    
    try {
      await onCreateProject(projectName, selectedTemplate);
      // Reset form
      setProjectName('');
      setSelectedTemplate(undefined);
      setSelectedTemplateName('');
      onClose();
    } catch (error) {
      console.error('Error creating project:', error);
      setError('Failed to create project. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleSelectTemplate = (templateId: string) => {
    const template = TemplateService.getTemplateById(templateId);
    setSelectedTemplate(templateId);
    setSelectedTemplateName(template?.name || '');
    setShowTemplateSelector(false);
  };

  // If template selector is open, show it instead of the main modal
  if (showTemplateSelector) {
    return (
      <TemplateSelector 
        onSelectTemplate={handleSelectTemplate} 
        onCancel={() => setShowTemplateSelector(false)} 
      />
    );
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        style={{ backgroundColor: colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <FolderPlus size={20} color={colors.primary} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Create New Project
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
        
        {error && (
          <div 
            className="p-3 mx-4 mt-4 rounded-md"
            style={{ backgroundColor: `${colors.error}15`, color: colors.error }}
          >
            {error}
          </div>
        )}
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Awesome Project"
              className="w-full p-2 border rounded-md"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }}
              autoFocus
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium" style={{ color: colors.text }}>
              Template
            </label>
            {selectedTemplate ? (
              <div 
                className="flex items-center justify-between p-2 border rounded-md"
                style={{ 
                  backgroundColor: `${colors.primary}10`,
                  borderColor: colors.primary
                }}
              >
                <span style={{ color: colors.text }}>{selectedTemplateName}</span>
                <button 
                  className="text-sm text-blue-500 hover:text-blue-700"
                  onClick={() => setSelectedTemplate(undefined)}
                  style={{ color: colors.primary }}
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                className="w-full p-2 border border-dashed rounded-md flex items-center justify-center gap-2"
                style={{ 
                  borderColor: colors.border,
                  color: colors.textSecondary
                }}
                onClick={() => setShowTemplateSelector(true)}
              >
                <Plus size={16} />
                Choose a template
              </button>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t" style={{ borderColor: colors.border }}>
          <button
            className="px-4 py-2 border rounded-md"
            style={{ 
              borderColor: colors.border,
              color: colors.text,
              backgroundColor: 'transparent'
            }}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white',
              opacity: isCreating || !projectName.trim() ? 0.7 : 1
            }}
            onClick={handleCreateProject}
            disabled={isCreating || !projectName.trim()}
          >
            {isCreating ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewProjectModal;