import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import GitService, { BranchInfo } from '../../services/GitService';
import { GitBranch, ChevronDown, Check, Plus, Search, X } from 'lucide-react';
import styles from './BranchSelector.module.css';

interface BranchSelectorProps {
  onBranchChange?: (branch: string) => void;
}

const BranchSelector: React.FC<BranchSelectorProps> = ({ onBranchChange }) => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  
  // Load branches when component mounts or project changes
  useEffect(() => {
    if (currentProject) {
      loadBranches();
    }
  }, [currentProject]);
  
  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateBranch(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Load branches from Git service
  const loadBranches = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const branchesData = await GitService.getBranches(currentProject.id);
      setBranches(branchesData);
      
      // Set current branch
      const current = branchesData.find(b => b.current);
      if (current) {
        setCurrentBranch(current.name);
      }
    } catch (err: any) {
      console.error('Error loading branches:', err);
      setError('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };
  
  // Create a new branch
  const handleCreateBranch = async () => {
    if (!currentProject || !newBranchName.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await GitService.createBranch(currentProject.id, newBranchName);
      if (success) {
        await GitService.checkoutBranch(currentProject.id, newBranchName);
        await loadBranches();
        setNewBranchName('');
        setShowCreateBranch(false);
        setIsOpen(false);
        
        if (onBranchChange) {
          onBranchChange(newBranchName);
        }
      } else {
        setError('Failed to create branch');
      }
    } catch (err: any) {
      console.error('Error creating branch:', err);
      setError(err.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };
  
  // Switch to a different branch
  const handleBranchSelect = async (branchName: string) => {
    if (!currentProject || branchName === currentBranch) {
      setIsOpen(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const success = await GitService.checkoutBranch(currentProject.id, branchName);
      if (success) {
        await loadBranches();
        setIsOpen(false);
        
        if (onBranchChange) {
          onBranchChange(branchName);
        }
      } else {
        setError(`Failed to switch to branch: ${branchName}`);
      }
    } catch (err: any) {
      console.error('Error switching branch:', err);
      setError(err.message || 'Failed to switch branch');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter branches based on search query
  const filteredBranches = branches.filter(branch => 
    branch.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  return (
    <div 
      ref={selectorRef}
      className={styles.container}
    >
      <button 
        className={styles.branchButton}
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.text
        }}
      >
        <GitBranch size={16} color={colors.primary} />
        <span>{currentBranch}</span>
        <ChevronDown 
          size={16} 
          color={colors.textSecondary}
          style={{ 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        />
      </button>
      
      {isOpen && (
        <div 
          className={styles.dropdown}
          style={{ 
            backgroundColor: colors.surface,
            borderColor: colors.border,
            color: colors.text
          }}
        >
          {showCreateBranch ? (
            <div className={styles.createBranchForm}>
              <div className={styles.formHeader}>
                <h3 style={{ color: colors.text }}>Create Branch</h3>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowCreateBranch(false)}
                >
                  <X size={16} color={colors.textSecondary} />
                </button>
              </div>
              
              {error && (
                <div 
                  className={styles.error}
                  style={{ color: colors.error }}
                >
                  {error}
                </div>
              )}
              
              <div className={styles.formGroup}>
                <label style={{ color: colors.textSecondary }}>From: {currentBranch}</label>
                <input 
                  type="text"
                  className={styles.input}
                  placeholder="New branch name"
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{ 
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.text
                  }}
                />
              </div>
              
              <button 
                className={styles.createButton}
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim() || loading}
                style={{ 
                  backgroundColor: colors.primary,
                  opacity: !newBranchName.trim() || loading ? 0.7 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Branch'}
              </button>
            </div>
          ) : (
            <>
              <div 
                className={styles.searchContainer}
                style={{ borderBottomColor: colors.border }}
              >
                <Search size={14} color={colors.textSecondary} />
                <input 
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search branches"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ color: colors.text }}
                />
                {searchQuery && (
                  <button 
                    className={styles.clearButton}
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={14} color={colors.textSecondary} />
                  </button>
                )}
              </div>
              
              {error && (
                <div 
                  className={styles.error}
                  style={{ color: colors.error }}
                >
                  {error}
                </div>
              )}
              
              <div className={styles.branchList}>
                {loading ? (
                  <div 
                    className={styles.loadingMessage}
                    style={{ color: colors.textSecondary }}
                  >
                    Loading branches...
                  </div>
                ) : filteredBranches.length > 0 ? (
                  filteredBranches.map(branch => (
                    <button 
                      key={branch.name}
                      className={`${styles.branchItem} ${branch.current ? styles.currentBranch : ''}`}
                      onClick={() => handleBranchSelect(branch.name)}
                      style={{ 
                        backgroundColor: branch.current ? `${colors.primary}15` : undefined,
                      }}
                    >
                      <div className={styles.branchItemContent}>
                        <GitBranch 
                          size={14} 
                          color={branch.current ? colors.primary : colors.textSecondary} 
                        />
                        <span style={{ color: branch.current ? colors.primary : colors.text }}>
                          {branch.name}
                        </span>
                      </div>
                      
                      {branch.current && (
                        <Check size={14} color={colors.primary} />
                      )}
                    </button>
                  ))
                ) : (
                  <div 
                    className={styles.emptyMessage}
                    style={{ color: colors.textSecondary }}
                  >
                    {searchQuery ? 'No matching branches found' : 'No branches found'}
                  </div>
                )}
              </div>
              
              <button 
                className={styles.createBranchButton}
                onClick={() => setShowCreateBranch(true)}
                style={{ borderTopColor: colors.border }}
              >
                <Plus size={14} color={colors.primary} />
                <span style={{ color: colors.primary }}>Create new branch</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BranchSelector;