import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GlobalSearch from '../components/Search/GlobalSearch';
import { useProject } from '../context/ProjectContext';

const SearchScreen = () => {
  const navigate = useNavigate();
  const { openFiles, setCurrentFile } = useProject();
  
  const handleClose = () => {
    navigate('/explorer');
  };
  
  const handleFileSelect = (fileId: string, lineNumber: number) => {
    // Check if file is already open
    const fileTab = openFiles.find(f => f.id === fileId);
    
    if (fileTab) {
      setCurrentFile(fileId);
      // TODO: When selecting a search result, we should scroll to the line
      // This would require extending the editor component
    }
    
    navigate('/editor');
  };
  
  return <GlobalSearch onClose={handleClose} onFileSelect={handleFileSelect} />;
};

export default SearchScreen;