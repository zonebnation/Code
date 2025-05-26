import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Share2 } from 'lucide-react';
import { Project, File } from '../../types/editor';
import ShareModal from './ShareModal';

interface ShareButtonProps {
  project?: Project;
  file?: File;
  size?: number;
  label?: string;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({
  project,
  file,
  size = 18,
  label,
  className
}) => {
  const { colors } = useTheme();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  if (!project && !file) {
    return null;
  }

  return (
    <>
      <button
        className={className || 'flex items-center gap-2 p-2 rounded hover:bg-opacity-80 transition-colors'}
        style={{ 
          backgroundColor: className ? undefined : colors.primary,
          color: className ? colors.text : 'white'
        }}
        onClick={() => setIsShareModalOpen(true)}
        title="Share"
      >
        <Share2 size={size} />
        {label && <span>{label}</span>}
      </button>
      
      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        project={project}
        file={file}
      />
    </>
  );
};

export default ShareButton;