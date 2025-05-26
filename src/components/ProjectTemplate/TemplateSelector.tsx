import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import TemplateService, { ProjectTemplate } from '../../services/TemplateService';
import { FolderPlus, Search, X } from 'lucide-react';

interface TemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onCancel: () => void;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ onSelectTemplate, onCancel }) => {
  const { colors } = useTheme();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [allFrameworks, setAllFrameworks] = useState<string[]>([]);
  
  // Load templates
  useEffect(() => {
    const allTemplates = TemplateService.getAllTemplates();
    setTemplates(allTemplates);
    
    // Extract unique frameworks
    const frameworks = [...new Set(allTemplates.map(template => template.framework))];
    setAllFrameworks(frameworks);
  }, []);
  
  // Filter templates based on search query and selected framework
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      searchQuery === '' || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFramework = 
      selectedFramework === null || 
      template.framework === selectedFramework;
    
    return matchesSearch && matchesFramework;
  });

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        style={{ backgroundColor: colors.surface }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="flex items-center gap-2">
            <FolderPlus size={20} color={colors.primary} />
            <h2 className="text-xl font-semibold" style={{ color: colors.text }}>
              Create from Template
            </h2>
          </div>
          <button 
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            onClick={onCancel}
            aria-label="Close"
          >
            <X size={20} color={colors.textSecondary} />
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="p-4 border-b" style={{ borderColor: colors.border }}>
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} color={colors.textSecondary} />
            </div>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-md border"
              style={{ 
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <X size={16} color={colors.textSecondary} />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFramework(null)}
              className="px-3 py-1 text-sm rounded-full"
              style={{ 
                backgroundColor: selectedFramework === null ? colors.primary : colors.background,
                color: selectedFramework === null ? 'white' : colors.text,
                border: `1px solid ${selectedFramework === null ? colors.primary : colors.border}`
              }}
            >
              All
            </button>
            {allFrameworks.map((framework) => (
              <button
                key={framework}
                onClick={() => setSelectedFramework(framework === selectedFramework ? null : framework)}
                className="px-3 py-1 text-sm rounded-full"
                style={{ 
                  backgroundColor: framework === selectedFramework ? colors.primary : colors.background,
                  color: framework === selectedFramework ? 'white' : colors.text,
                  border: `1px solid ${framework === selectedFramework ? colors.primary : colors.border}`
                }}
              >
                {framework}
              </button>
            ))}
          </div>
        </div>
        
        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8" style={{ color: colors.textSecondary }}>
              No templates found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="border rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105"
                  style={{ 
                    backgroundColor: colors.surface, 
                    borderColor: colors.border,
                  }}
                  onClick={() => onSelectTemplate(template.id)}
                >
                  <div className="h-36 flex items-center justify-center" style={{ backgroundColor: `${colors.primary}10` }}>
                    {template.icon ? (
                      <img 
                        src={template.icon} 
                        alt={template.name} 
                        className="h-20 object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "https://via.placeholder.com/150?text=Template";
                        }}
                      />
                    ) : (
                      <FolderPlus size={40} color={colors.primary} />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1" style={{ color: colors.text }}>
                      {template.name}
                    </h3>
                    <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
                      {template.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span 
                          key={tag} 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: `${colors.primary}20`,
                            color: colors.primary
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{ 
                            backgroundColor: colors.background,
                            color: colors.textSecondary
                          }}
                        >
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-end" style={{ borderColor: colors.border }}>
          <button
            className="px-4 py-2 rounded-md border mr-2"
            style={{ 
              backgroundColor: colors.background,
              color: colors.text,
              borderColor: colors.border
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-md"
            style={{ 
              backgroundColor: colors.primary,
              color: 'white'
            }}
            onClick={() => {
              if (filteredTemplates.length > 0) {
                onSelectTemplate(filteredTemplates[0].id);
              }
            }}
            disabled={filteredTemplates.length === 0}
          >
            Create Custom Project
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;