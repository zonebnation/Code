import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import { 
  GitBranch, 
  GitCommit, 
  GitPullRequest, 
  ChevronLeft,
  Upload,
  Download
} from 'lucide-react';
import GitPanel from '../components/VersionControl/GitPanel';
import EmptyState from '../components/shared/EmptyState';
import GitService, { CommitInfo, BranchInfo } from '../services/GitService';
import styles from './VersionControlScreen.module.css';

const VersionControlScreen = () => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      loadGitData();
    }
  }, [currentProject]);

  const loadGitData = async () => {
    if (!currentProject) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Initialize Git repository
      await GitService.initRepo(currentProject.id);
      
      // Load commits
      const commitsData = await GitService.getCommits(currentProject.id);
      setCommits(commitsData.sort((a, b) => b.date.getTime() - a.date.getTime()));
      
      // Load branches
      const branchesData = await GitService.getBranches(currentProject.id);
      setBranches(branchesData);
      
      // Set current branch
      const currentBranchInfo = branchesData.find(b => b.current);
      if (currentBranchInfo) {
        setCurrentBranch(currentBranchInfo.name);
      }
    } catch (err: any) {
      console.error('Error loading Git data:', err);
      setError(err.message || 'Failed to load Git data');
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      await GitService.pull(currentProject.id);
      await loadGitData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to pull from remote');
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!currentProject) return;
    
    try {
      setLoading(true);
      await GitService.push(currentProject.id);
      await loadGitData(); // Refresh data
    } catch (err: any) {
      setError(err.message || 'Failed to push to remote');
    } finally {
      setLoading(false);
    }
  };

  if (!currentProject) {
    return (
      <EmptyState
        icon="FileCode"
        title="No Project Open"
        message="Open a project to use version control features."
        actionText="Open Project"
        actionPath="/explorer"
      />
    );
  }

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border
        }}
      >
        <div className={styles.projectInfo}>
          <h2 style={{ color: colors.text }}>
            {currentProject.name}
          </h2>
          <div 
            className={styles.branchInfo}
            style={{ color: colors.textSecondary }}
          >
            <GitBranch size={16} />
            <span>{currentBranch || 'main'}</span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.actionButton}
            onClick={handlePull}
            title="Pull from remote"
            style={{ backgroundColor: colors.surface }}
          >
            <Download size={18} color={colors.textSecondary} />
            <span style={{ color: colors.text }}>Pull</span>
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={handlePush}
            title="Push to remote"
            style={{ backgroundColor: colors.primary }}
          >
            <Upload size={18} color="#FFFFFF" />
            <span style={{ color: "#FFFFFF" }}>Push</span>
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loading}>
          Loading Git data...
        </div>
      ) : error ? (
        <div 
          className={styles.error}
          style={{ color: colors.error }}
        >
          {error}
        </div>
      ) : (
        <div className={styles.content}>
          <GitPanel />
        </div>
      )}
    </div>
  );
};

export default VersionControlScreen;