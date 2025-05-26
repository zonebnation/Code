import React from 'react';
import { useTheme } from '../context/ThemeContext';
import MySharedItems from '../components/Sharing/MySharedItems';
import { Share2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SharedItemsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  return (
    <div 
      className="h-full flex flex-col"
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className="flex items-center p-4 border-b"
        style={{ borderColor: colors.border }}
      >
        <button
          className="p-2 mr-2 rounded-full"
          onClick={() => navigate(-1)}
          style={{ color: colors.primary }}
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <Share2 size={20} color={colors.primary} />
          <h1 className="text-xl font-semibold" style={{ color: colors.text }}>
            Shared Items
          </h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <MySharedItems />
      </div>
    </div>
  );
};

export default SharedItemsScreen;