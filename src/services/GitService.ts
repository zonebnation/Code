export interface CommitInfo {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: Date;
  branch?: string;
}

export interface BranchInfo {
  name: string;
  current: boolean;
}

export interface StatusInfo {
  staged: string[];
  unstaged: string[];
  untracked: string[];
}

class GitService {
  private commits: Map<string, CommitInfo[]> = new Map();
  private branches: Map<string, BranchInfo[]> = new Map();
  private status: Map<string, StatusInfo> = new Map();
  
  constructor() {
    // Initialize with sample data for demo purposes
    this.setupSampleData();
  }
  
  private setupSampleData() {
    // Sample commit history
    const sampleCommits: CommitInfo[] = [
      {
        hash: 'abc123def456abc123def456abc123def456abcd',
        shortHash: 'abc123d',
        message: 'Initial commit',
        author: 'John Doe <john@example.com>',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        branch: 'main'
      },
      {
        hash: 'def456abc123def456abc123def456abc123defg',
        shortHash: 'def456a',
        message: 'Add basic project structure',
        author: 'John Doe <john@example.com>',
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        branch: 'main'
      },
      {
        hash: '789abc123def456abc123def456abc123def456h',
        shortHash: '789abc1',
        message: 'Implement core functionality',
        author: 'Jane Smith <jane@example.com>',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        branch: 'main'
      }
    ];
    
    // Sample branches
    const sampleBranches: BranchInfo[] = [
      { name: 'main', current: true },
      { name: 'feature/new-ui', current: false },
      { name: 'fix/bug-123', current: false }
    ];
    
    // Sample status
    const sampleStatus: StatusInfo = {
      staged: [],
      unstaged: ['index.js', 'src/app.js'],
      untracked: ['newfile.txt']
    };
    
    // Add sample data to maps with a sample project ID
    this.commits.set('sample-project-1', sampleCommits);
    this.branches.set('sample-project-1', sampleBranches);
    this.status.set('sample-project-1', sampleStatus);
  }
  
  // Initialize repository
  async initRepo(projectId: string): Promise<void> {
    if (!this.commits.has(projectId)) {
      // Create initial data for a new repository
      this.commits.set(projectId, [
        {
          hash: this.generateRandomHash(),
          shortHash: this.generateRandomHash().substring(0, 7),
          message: 'Initial commit',
          author: 'User <user@example.com>',
          date: new Date(),
          branch: 'main'
        }
      ]);
      
      this.branches.set(projectId, [
        { name: 'main', current: true }
      ]);
      
      this.status.set(projectId, {
        staged: [],
        unstaged: [],
        untracked: []
      });
    }
  }
  
  // Generate a random Git-like hash
  private generateRandomHash(): string {
    const chars = 'abcdef0123456789';
    let hash = '';
    for (let i = 0; i < 40; i++) {
      hash += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return hash;
  }
  
  // Get repository status
  async getStatus(projectId: string): Promise<StatusInfo> {
    return this.status.get(projectId) || { staged: [], unstaged: [], untracked: [] };
  }
  
  // Stage files
  async stageFiles(projectId: string, files: string[]): Promise<void> {
    const status = this.status.get(projectId);
    if (!status) return;
    
    // Move files from unstaged/untracked to staged
    const newStaged = [...status.staged];
    const newUnstaged = [...status.unstaged];
    const newUntracked = [...status.untracked];
    
    for (const file of files) {
      if (status.unstaged.includes(file)) {
        newUnstaged.splice(newUnstaged.indexOf(file), 1);
        if (!newStaged.includes(file)) {
          newStaged.push(file);
        }
      } else if (status.untracked.includes(file)) {
        newUntracked.splice(newUntracked.indexOf(file), 1);
        if (!newStaged.includes(file)) {
          newStaged.push(file);
        }
      }
    }
    
    this.status.set(projectId, {
      staged: newStaged,
      unstaged: newUnstaged,
      untracked: newUntracked
    });
  }
  
  // Unstage files
  async unstageFiles(projectId: string, files: string[]): Promise<void> {
    const status = this.status.get(projectId);
    if (!status) return;
    
    const newStaged = [...status.staged];
    const newUnstaged = [...status.unstaged];
    
    for (const file of files) {
      if (status.staged.includes(file)) {
        newStaged.splice(newStaged.indexOf(file), 1);
        if (!newUnstaged.includes(file)) {
          newUnstaged.push(file);
        }
      }
    }
    
    this.status.set(projectId, {
      ...status,
      staged: newStaged,
      unstaged: newUnstaged
    });
  }
  
  // Commit changes
  async commit(projectId: string, message: string): Promise<void> {
    const status = this.status.get(projectId);
    const branches = this.branches.get(projectId);
    const commits = this.commits.get(projectId);
    
    if (!status || !branches || !commits) return;
    
    if (status.staged.length === 0) {
      throw new Error('No changes to commit');
    }
    
    // Find current branch
    const currentBranch = branches.find(b => b.current)?.name || 'main';
    
    // Create new commit
    const newCommit: CommitInfo = {
      hash: this.generateRandomHash(),
      shortHash: this.generateRandomHash().substring(0, 7),
      message,
      author: 'User <user@example.com>',
      date: new Date(),
      branch: currentBranch
    };
    
    // Add commit to history
    commits.unshift(newCommit);
    this.commits.set(projectId, commits);
    
    // Clear staged changes
    this.status.set(projectId, {
      ...status,
      staged: []
    });
  }
  
  // Get commits
  async getCommits(projectId: string): Promise<CommitInfo[]> {
    return this.commits.get(projectId) || [];
  }
  
  // Get branches
  async getBranches(projectId: string): Promise<BranchInfo[]> {
    return this.branches.get(projectId) || [];
  }
  
  // Create branch
  async createBranch(projectId: string, name: string): Promise<boolean> {
    const branches = this.branches.get(projectId);
    if (!branches) return false;
    
    // Check if branch already exists
    if (branches.some(b => b.name === name)) {
      return false;
    }
    
    // Add new branch
    branches.push({ name, current: false });
    this.branches.set(projectId, branches);
    
    return true;
  }
  
  // Switch to branch
  async checkoutBranch(projectId: string, name: string): Promise<boolean> {
    const branches = this.branches.get(projectId);
    if (!branches) return false;
    
    // Check if branch exists
    if (!branches.some(b => b.name === name)) {
      return false;
    }
    
    // Update current branch
    const updatedBranches = branches.map(b => ({
      ...b,
      current: b.name === name
    }));
    
    this.branches.set(projectId, updatedBranches);
    
    return true;
  }
  
  // Pull from remote (simulated)
  async pull(projectId: string): Promise<boolean> {
    // In a real implementation, this would actually pull from a remote repository
    // For simulation, just wait a bit and return success
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }
  
  // Push to remote (simulated)
  async push(projectId: string): Promise<boolean> {
    // In a real implementation, this would actually push to a remote repository
    // For simulation, just wait a bit and return success
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return true;
  }
}

export default new GitService();