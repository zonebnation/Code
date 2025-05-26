import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Eye, Lock, Globe, Link2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ShareBadgeProps {
  type: 'public' | 'private' | 'link';
  shareId: string;
  viewCount?: number;
  showTooltip?: boolean;
}

const ShareBadge: React.FC<ShareBadgeProps> = ({
  type,
  shareId,
  viewCount = 0,
  showTooltip = false
}) => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const getIcon = () => {
    switch (type) {
      case 'public':
        return <Globe size={14} color="currentColor" />;
      case 'private':
        return <Lock size={14} color="currentColor" />;
      case 'link':
      default:
        return <Link2 size={14} color="currentColor" />;
    }
  };
  
  const getBadgeColor = () => {
    switch (type) {
      case 'public':
        return colors.success;
      case 'private':
        return colors.warning;
      case 'link':
      default:
        return colors.primary;
    }
  };
  
  const handleClick = () => {
    navigate(`/shares/${shareId}`);
  };
  
  return (
    <div className="relative inline-block">
      <button
        className="flex items-center gap-1 py-1 px-2 rounded-full text-xs"
        style={{ 
          backgroundColor: `${getBadgeColor()}20`, 
          color: getBadgeColor(),
        }}
        onClick={handleClick}
      >
        {getIcon()}
        <span className="capitalize">{type}</span>
        {viewCount > 0 && (
          <div className="flex items-center gap-1 ml-1">
            <Eye size={12} />
            <span>{viewCount}</span>
          </div>
        )}
      </button>
      
      {showTooltip && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded shadow-md whitespace-nowrap z-10"
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          Click to view shared item
          <div
            className="absolute top-full left-1/2 transform -translate-x-1/2"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${colors.surface}`
            }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default ShareBadge;