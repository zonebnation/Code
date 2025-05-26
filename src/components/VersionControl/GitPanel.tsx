import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import GitService, { CommitInfo, StatusInfo, BranchInfo } from '../../services/GitService';
import { 
  GitBranch, 
  Plus, 
  Check, 
  ChevronDown, 
  RefreshCw,
  Upload,
  Download,
  GitCommit,
  AlertCircle,
  X,
  Clock,
  Trash
} from 'lucide-react';
import styles from './GitPanel.module.css';
import CommitDetails from './CommitDetails';

const GitPanel: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<StatusInfo | null>(null);
  const [commits, setCommits] = useState<CommitInfo[]>([]);
  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [currentBranch, setCurrentBranch] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'changes' | 'history' | 'branches'>('changes');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [showCreateBranch, setShowCreateBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [selectedCommit, setSelectedCommit] = useState<CommitInfo | null>(null);

  // Initialize Git when project changes
  useEffect(() => {
    if (currentProject) {
      initializeGit();
    }
  }, [currentProject]);

  // Load Git data
  const initializeGit = async () => {
    if (!currentProject) return;

    setLoading(true);
    setError(null);

    try {
      await GitService.initRepo(currentProject.id);
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Git');
    } finally {
      setLoading(false);
    }
  };

  // Refresh Git data (status, commits, branches)
  const refreshGitData = async () => {
    if (!currentProject) return;

    setLoading(true);
    
    try {
      // Get repository status
      const statusData = await GitService.getStatus(currentProject.id);
      setStatus(statusData);
      
      // Get commit history
      const commitsData = await GitService.getCommits(currentProject.id);
      setCommits(commitsData.sort((a, b) => b.date.getTime() - a.date.getTime()));
      
      // Get branches
      const branchesData = await GitService.getBranches(currentProject.id);
      setBranches(branchesData);
      
      // Set current branch
      const currentBranchData = branchesData.find(b => b.current);
      setCurrentBranch(currentBranchData?.name || 'main');
      
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh Git data');
    } finally {
      setLoading(false);
    }
  };

  // Stage selected files
  const handleStageFiles = async () => {
    if (!currentProject || selectedFiles.size === 0) return;

    setLoading(true);
    
    try {
      await GitService.stageFiles(currentProject.id, Array.from(selectedFiles));
      setSelectedFiles(new Set());
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to stage files');
    } finally {
      setLoading(false);
    }
  };

  // Unstage selected files
  const handleUnstageFiles = async () => {
    if (!currentProject || selectedFiles.size === 0) return;

    setLoading(true);
    
    try {
      await GitService.unstageFiles(currentProject.id, Array.from(selectedFiles));
      setSelectedFiles(new Set());
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to unstage files');
    } finally {
      setLoading(false);
    }
  };

  // Commit staged changes
  const handleCommit = async () => {
    if (!currentProject || !status || status.staged.length === 0 || !commitMessage.trim()) return;

    setLoading(true);
    
    try {
      await GitService.commit(currentProject.id, commitMessage);
      setCommitMessage('');
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to commit changes');
    } finally {
      setLoading(false);
    }
  };

  // Pull from remote
  const handlePull = async () => {
    if (!currentProject) return;

    setLoading(true);
    
    try {
      await GitService.pull(currentProject.id);
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to pull from remote');
    } finally {
      setLoading(false);
    }
  };

  // Push to remote
  const handlePush = async () => {
    if (!currentProject) return;

    setLoading(true);
    
    try {
      await GitService.push(currentProject.id);
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to push to remote');
    } finally {
      setLoading(false);
    }
  };

  // Create a new branch
  const handleCreateBranch = async () => {
    if (!currentProject || !newBranchName.trim()) return;

    setLoading(true);
    
    try {
      await GitService.createBranch(currentProject.id, newBranchName);
      setNewBranchName('');
      setShowCreateBranch(false);
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to create branch');
    } finally {
      setLoading(false);
    }
  };

  // Switch to a branch
  const handleCheckoutBranch = async (branchName: string) => {
    if (!currentProject) return;

    setLoading(true);
    
    try {
      await GitService.checkoutBranch(currentProject.id, branchName);
      await refreshGitData();
    } catch (err: any) {
      setError(err.message || 'Failed to checkout branch');
    } finally {
      setLoading(false);
    }
  };

  // Toggle file selection
  const toggleFileSelection = (filePath: string) => {
    setSelectedFiles(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(filePath)) {
        newSelection.delete(filePath);
      } else {
        newSelection.add(filePath);
      }
      return newSelection;
    });
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };
  
  // Format relative date for display
  const formatRelativeDate = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(date);
    }
  };

  // Truncate long file paths
  const truncateFilePath = (path: string, maxLength = 40) => {
    if (path.length <= maxLength) return path;
    
    const parts = path.split('/');
    const fileName = parts.pop() || '';
    
    // Ensure the file name is always visible
    if (fileName.length >= maxLength - 3) {
      return '...' + fileName.substring(fileName.length - maxLength + 3);
    }
    
    // Show as much of the path as possible
    let result = fileName;
    let currentLength = fileName.length;
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      
      // Check if adding this part (plus slash) would exceed max length
      if (currentLength + part.length + 1 + 3 > maxLength) {
        return '...' + result;
      }
      
      result = part + '/' + result;
      currentLength += part.length + 1;
    }
    
    return result;
  };
  
  // Handle viewing commit details
  const handleViewCommit = (commit: CommitInfo) => {
    setSelectedCommit(commit);
  };
  
  // Navigate to previous commit in history
  const handlePreviousCommit = () => {
    if (!selectedCommit || commits.length <= 1) return;
    
    const currentIndex = commits.findIndex(c => c.hash === selectedCommit.hash);
    if (currentIndex < commits.length - 1) {
      setSelectedCommit(commits[currentIndex + 1]);
    }
  };
  
  // Navigate to next commit in history
  const handleNextCommit = () => {
    if (!selectedCommit) return;
    
    const currentIndex = commits.findIndex(c => c.hash === selectedCommit.hash);
    if (currentIndex > 0) {
      setSelectedCommit(commits[currentIndex - 1]);
    }
  };

  if (!currentProject) {
    return (
      <div 
        className={styles.emptyState}
        style={{ backgroundColor: colors.background }}
      >
        <GitBranch size={40} color={colors.textSecondary} />
        <p style={{ color: colors.textSecondary }}>
          Open a project to use version control
        </p>
      </div>
    );
  }

  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      {/* Header */}
      <div 
        className={styles.header}
        style={{ 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border
        }}
      >
        <div className={styles.branchSelector}>
          <button 
            className={styles.branchButton}
            onClick={() => setShowCreateBranch(!showCreateBranch)}
          >
            <GitBranch size={16} color={colors.textSecondary} />
            <span style={{ color: colors.text }}>{currentBranch}</span>
            <ChevronDown size={14} color={colors.textSecondary} />
          </button>
          
          {showCreateBranch && (
            <div 
              className={styles.branchForm}
              style={{ 
                backgroundColor: colors.surface,
                borderColor: colors.border
              }}
            >
              <input
                type="text"
                value={newBranchName}
                onChange={(e) => setNewBranchName(e.target.value)}
                placeholder="New branch name"
                className={styles.branchInput}
                style={{ 
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text
                }}
              />
              <button 
                className={styles.createBranchButton}
                onClick={handleCreateBranch}
                disabled={!newBranchName.trim()}
                style={{ 
                  backgroundColor: colors.primary,
                  opacity: !newBranchName.trim() ? 0.7 : 1
                }}
              >
                Create
              </button>
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <button 
            className={styles.action}
            onClick={handlePull}
            title="Pull"
          >
            <Download size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.action}
            onClick={handlePush}
            title="Push"
          >
            <Upload size={16} color={colors.textSecondary} />
          </button>
          <button 
            className={styles.action}
            onClick={refreshGitData}
            title="Refresh"
          >
            <RefreshCw size={16} color={colors.textSecondary} />
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div 
          className={styles.error}
          style={{ 
            backgroundColor: `${colors.error}20`,
            color: colors.error
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div 
          className={styles.loading}
          style={{ color: colors.textSecondary }}
        >
          <RefreshCw size={16} className={styles.loadingIcon} />
          <span>Loading...</span>
        </div>
      )}

      {/* Tabs */}
      <div 
        className={styles.tabs}
        style={{ borderBottomColor: colors.border }}
      >
        <button 
          className={`${styles.tab} ${activeTab === 'changes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('changes')}
          style={{ 
            color: activeTab === 'changes' ? colors.primary : colors.textSecondary,
            borderBottomColor: activeTab === 'changes' ? colors.primary : 'transparent'
          }}
        >
          Changes
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'history' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('history')}
          style={{ 
            color: activeTab === 'history' ? colors.primary : colors.textSecondary,
            borderBottomColor: activeTab === 'history' ? colors.primary : 'transparent'
          }}
        >
          History
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'branches' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('branches')}
          style={{ 
            color: activeTab === 'branches' ? colors.primary : colors.textSecondary,
            borderBottomColor: activeTab === 'branches' ? colors.primary : 'transparent'
          }}
        >
          Branches
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'changes' && status && (
          <>
            {/* Staged Changes */}
            <div className={styles.section}>
              <div 
                className={styles.sectionHeader}
                style={{ color: colors.text }}
              >
                Staged Changes ({status.staged.length})
                {status.staged.length > 0 && (
                  <button 
                    className={styles.actionButton}
                    onClick={handleUnstageFiles}
                    title="Unstage selected"
                    disabled={selectedFiles.size === 0}
                    style={{ opacity: selectedFiles.size === 0 ? 0.5 : 1 }}
                  >
                    <X size={14} color={colors.textSecondary} />
                  </button>
                )}
              </div>
              {status.staged.length > 0 ? (
                <div className={styles.fileList}>
                  {status.staged.map(file => (
                    <div 
                      key={file}
                      className={styles.fileItem}
                      style={{ 
                        backgroundColor: selectedFiles.has(file) ? colors.selectedItem : 'transparent'
                      }}
                    >
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file)}
                          onChange={() => toggleFileSelection(file)}
                          className={styles.checkbox}
                        />
                        <span 
                          className={styles.fileName}
                          style={{ color: colors.text }}
                        >
                          {truncateFilePath(file)}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className={styles.emptyMessage}
                  style={{ color: colors.textSecondary }}
                >
                  No staged changes
                </div>
              )}
            </div>

            {/* Changes */}
            <div className={styles.section}>
              <div 
                className={styles.sectionHeader}
                style={{ color: colors.text }}
              >
                Changes ({status.unstaged.length})
                {status.unstaged.length > 0 && (
                  <button 
                    className={styles.actionButton}
                    onClick={handleStageFiles}
                    title="Stage selected"
                    disabled={selectedFiles.size === 0}
                    style={{ opacity: selectedFiles.size === 0 ? 0.5 : 1 }}
                  >
                    <Plus size={14} color={colors.textSecondary} />
                  </button>
                )}
              </div>
              {status.unstaged.length > 0 ? (
                <div className={styles.fileList}>
                  {status.unstaged.map(file => (
                    <div 
                      key={file}
                      className={styles.fileItem}
                      style={{ 
                        backgroundColor: selectedFiles.has(file) ? colors.selectedItem : 'transparent'
                      }}
                    >
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file)}
                          onChange={() => toggleFileSelection(file)}
                          className={styles.checkbox}
                        />
                        <span 
                          className={styles.fileName}
                          style={{ color: colors.text }}
                        >
                          {truncateFilePath(file)}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className={styles.emptyMessage}
                  style={{ color: colors.textSecondary }}
                >
                  No unstaged changes
                </div>
              )}
            </div>

            {/* Untracked Files */}
            <div className={styles.section}>
              <div 
                className={styles.sectionHeader}
                style={{ color: colors.text }}
              >
                Untracked Files ({status.untracked.length})
                {status.untracked.length > 0 && (
                  <button 
                    className={styles.actionButton}
                    onClick={handleStageFiles}
                    title="Stage selected"
                    disabled={selectedFiles.size === 0}
                    style={{ opacity: selectedFiles.size === 0 ? 0.5 : 1 }}
                  >
                    <Plus size={14} color={colors.textSecondary} />
                  </button>
                )}
              </div>
              {status.untracked.length > 0 ? (
                <div className={styles.fileList}>
                  {status.untracked.map(file => (
                    <div 
                      key={file}
                      className={styles.fileItem}
                      style={{ 
                        backgroundColor: selectedFiles.has(file) ? colors.selectedItem : 'transparent'
                      }}
                    >
                      <label className={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file)}
                          onChange={() => toggleFileSelection(file)}
                          className={styles.checkbox}
                        />
                        <span 
                          className={styles.fileName}
                          style={{ color: colors.text }}
                        >
                          {truncateFilePath(file)}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  className={styles.emptyMessage}
                  style={{ color: colors.textSecondary }}
                >
                  No untracked files
                </div>
              )}
            </div>

            {/* Commit Form */}
            <div 
              className={styles.commitForm}
              style={{ 
                backgroundColor: colors.surface,
                borderTopColor: colors.border
              }}
            >
              <textarea
                className={styles.commitMessage}
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message"
                disabled={status.staged.length === 0}
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                  color: colors.text,
                  opacity: status.staged.length === 0 ? 0.7 : 1
                }}
              />
              <button
                className={styles.commitButton}
                onClick={handleCommit}
                disabled={status.staged.length === 0 || !commitMessage.trim()}
                style={{
                  backgroundColor: colors.primary,
                  opacity: (status.staged.length === 0 || !commitMessage.trim()) ? 0.7 : 1
                }}
              >
                Commit
              </button>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <div className={styles.commitList}>
            {commits.length > 0 ? (
              commits.map(commit => (
                <div 
                  key={commit.hash}
                  className={styles.commitItem}
                  style={{ borderBottomColor: colors.border }}
                  onClick={() => handleViewCommit(commit)}
                >
                  <div className={styles.commitHeader}>
                    <div className={styles.commitInfo}>
                      <div 
                        className={styles.commitHash}
                        style={{ color: colors.textSecondary }}
                      >
                        <GitCommit size={14} color={colors.primary} />
                        {commit.shortHash}
                      </div>
                      {commit.branch && (
                        <div 
                          className={styles.commitBranch}
                          style={{ 
                            backgroundColor: `${colors.primary}30`,
                            color: colors.primary
                          }}
                        >
                          {commit.branch}
                        </div>
                      )}
                    </div>
                    <div 
                      className={styles.commitDate}
                      style={{ color: colors.textSecondary }}
                    >
                      <Clock size={12} />
                      <span>{formatRelativeDate(commit.date)}</span>
                    </div>
                  </div>
                  <div 
                    className={styles.commitMessage}
                    style={{ color: colors.text }}
                  >
                    {commit.message}
                  </div>
                  <div 
                    className={styles.commitAuthor}
                    style={{ color: colors.textSecondary }}
                  >
                    {commit.author}
                  </div>
                </div>
              ))
            ) : (
              <div 
                className={styles.emptyMessage}
                style={{ color: colors.textSecondary }}
              >
                No commits yet
              </div>
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className={styles.branchList}>
            {branches.length > 0 ? (
              branches.map(branch => (
                <div 
                  key={branch.name}
                  className={`${styles.branchItem} ${branch.current ? styles.currentBranch : ''}`}
                  style={{ 
                    backgroundColor: branch.current ? `${colors.primary}15` : 'transparent',
                    borderLeftColor: branch.current ? colors.primary : 'transparent'
                  }}
                >
                  <div 
                    className={styles.branchName}
                    style={{ color: colors.text }}
                  >
                    <GitBranch 
                      size={16} 
                      color={branch.current ? colors.primary : colors.textSecondary} 
                    />
                    {branch.name}
                  </div>
                  {!branch.current && (
                    <button
                      className={styles.checkoutButton}
                      onClick={() => handleCheckoutBranch(branch.name)}
                    >
                      <Check size={14} color={colors.textSecondary} />
                      <span style={{ color: colors.textSecondary }}>Checkout</span>
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div 
                className={styles.emptyMessage}
                style={{ color: colors.textSecondary }}
              >
                No branches found
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Commit Details Modal */}
      {selectedCommit && (
        <div className={styles.modalOverlay} onClick={() => setSelectedCommit(null)}>
          <CommitDetails 
            commit={selectedCommit}
            onClose={() => setSelectedCommit(null)}
            onPrevious={handlePreviousCommit}
            onNext={handleNextCommit}
            hasPrevious={commits.findIndex(c => c.hash === selectedCommit.hash) < commits.length - 1}
            hasNext={commits.findIndex(c => c.hash === selectedCommit.hash) > 0}
          />
        </div>
      )}
    </div>
  );
};

export default GitPanel;