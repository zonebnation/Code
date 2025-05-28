import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, FileTab } from '../types/editor';

class LocalStorageService {
  private isAsyncStorage = typeof AsyncStorage !== 'undefined';
  
  // Project methods
  async saveProject(project: Project): Promise<void> {
    try {
      const key = `project_${project.id}`;
      const value = JSON.stringify(project);
      
      if (this.isAsyncStorage) {
        await AsyncStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
      
      // Update the projects list
      await this.addProjectToList(project.id);
    } catch (error) {
      console.error('Error saving project to storage:', error);
    }
  }
  
  async getProject(projectId: string): Promise<Project | null> {
    try {
      const key = `project_${projectId}`;
      let value;
      
      if (this.isAsyncStorage) {
        value = await AsyncStorage.getItem(key);
      } else {
        value = localStorage.getItem(key);
      }
      
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting project from storage:', error);
      return null;
    }
  }
  
  async deleteProject(projectId: string): Promise<void> {
    try {
      const key = `project_${projectId}`;
      
      if (this.isAsyncStorage) {
        await AsyncStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
      
      // Update the projects list
      await this.removeProjectFromList(projectId);
    } catch (error) {
      console.error('Error deleting project from storage:', error);
    }
  }
  
  // Project list management
  async addProjectToList(projectId: string): Promise<void> {
    try {
      const projectList = await this.getProjectList();
      if (!projectList.includes(projectId)) {
        projectList.push(projectId);
        await this.saveProjectList(projectList);
      }
    } catch (error) {
      console.error('Error adding project to list:', error);
    }
  }
  
  async removeProjectFromList(projectId: string): Promise<void> {
    try {
      const projectList = await this.getProjectList();
      const updatedList = projectList.filter(id => id !== projectId);
      await this.saveProjectList(updatedList);
    } catch (error) {
      console.error('Error removing project from list:', error);
    }
  }
  
  async getProjectList(): Promise<string[]> {
    try {
      const key = 'project_list';
      let value;
      
      if (this.isAsyncStorage) {
        value = await AsyncStorage.getItem(key);
      } else {
        value = localStorage.getItem(key);
      }
      
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting project list from storage:', error);
      return [];
    }
  }
  
  async saveProjectList(projectList: string[]): Promise<void> {
    try {
      const key = 'project_list';
      const value = JSON.stringify(projectList);
      
      if (this.isAsyncStorage) {
        await AsyncStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving project list to storage:', error);
    }
  }
  
  // Load all projects from storage
  loadProjects(): Project[] {
    try {
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return an empty array in this case
        console.warn('loadProjects sync method not supported with AsyncStorage');
        return [];
      }
      
      const projects: Project[] = [];
      const projectListStr = localStorage.getItem('project_list');
      const projectList = projectListStr ? JSON.parse(projectListStr) : [];
      
      for (const projectId of projectList) {
        const projectStr = localStorage.getItem(`project_${projectId}`);
        if (projectStr) {
          projects.push(JSON.parse(projectStr));
        }
      }
      
      return projects;
    } catch (error) {
      console.error('Error loading projects from storage:', error);
      return [];
    }
  }
  
  // Current project methods
  saveCurrentProjectId(projectId: string | null): void {
    try {
      const key = 'current_project_id';
      const value = projectId ? projectId : '';
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving current project ID:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving current project ID:', error);
    }
  }
  
  getCurrentProjectId(): string | null {
    try {
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return null in this case
        console.warn('getCurrentProjectId sync method not supported with AsyncStorage');
        return null;
      }
      
      const value = localStorage.getItem('current_project_id');
      return value && value.length > 0 ? value : null;
    } catch (error) {
      console.error('Error getting current project ID:', error);
      return null;
    }
  }
  
  // Recent projects methods
  saveRecentProjects(projects: Project[]): void {
    try {
      const key = 'recent_projects';
      // Only store the minimal info needed
      const minimalProjects = projects.map(p => ({
        id: p.id,
        name: p.name,
        path: p.path,
        createdAt: p.createdAt,
        // Use nullish coalescing to provide a fallback
        updatedAt: p.createdAt
      }));
      const value = JSON.stringify(minimalProjects);
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving recent projects:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving recent projects:', error);
    }
  }
  
  loadRecentProjects(): Project[] {
    try {
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return an empty array in this case
        console.warn('loadRecentProjects sync method not supported with AsyncStorage');
        return [];
      }
      
      const value = localStorage.getItem('recent_projects');
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error loading recent projects:', error);
      return [];
    }
  }
  
  // Open tabs methods
  saveOpenTabs(projectId: string, tabs: FileTab[]): void {
    try {
      const key = `open_tabs_${projectId}`;
      const value = JSON.stringify(tabs);
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving open tabs:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving open tabs:', error);
    }
  }
  
  loadOpenTabs(projectId: string): FileTab[] {
    try {
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return an empty array in this case
        console.warn('loadOpenTabs sync method not supported with AsyncStorage');
        return [];
      }
      
      const value = localStorage.getItem(`open_tabs_${projectId}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error loading open tabs:', error);
      return [];
    }
  }
  
  // Current file methods
  saveCurrentFileId(projectId: string, fileId: string | null): void {
    try {
      if (!projectId) return;
      
      const key = `current_file_${projectId}`;
      const value = fileId ? fileId : '';
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving current file ID:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving current file ID:', error);
    }
  }
  
  getCurrentFileId(projectId: string): string | null {
    try {
      if (!projectId) return null;
      
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return null in this case
        console.warn('getCurrentFileId sync method not supported with AsyncStorage');
        return null;
      }
      
      const value = localStorage.getItem(`current_file_${projectId}`);
      return value && value.length > 0 ? value : null;
    } catch (error) {
      console.error('Error getting current file ID:', error);
      return null;
    }
  }
  
  // Unsaved files methods
  saveUnsavedFiles(projectId: string, fileIds: string[]): void {
    try {
      if (!projectId) return;
      
      const key = `unsaved_files_${projectId}`;
      const value = JSON.stringify(fileIds);
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving unsaved files:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving unsaved files:', error);
    }
  }
  
  loadUnsavedFiles(projectId: string): string[] {
    try {
      if (!projectId) return [];
      
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return an empty array in this case
        console.warn('loadUnsavedFiles sync method not supported with AsyncStorage');
        return [];
      }
      
      const value = localStorage.getItem(`unsaved_files_${projectId}`);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error loading unsaved files:', error);
      return [];
    }
  }
  
  // Pending changes (for offline mode)
  savePendingChange(projectId: string, fileId: string, content: string): void {
    try {
      if (!projectId || !fileId) return;
      
      const key = `pending_change_${projectId}_${fileId}`;
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, content).catch(err => {
          console.error('Error saving pending change:', err);
        });
      } else {
        localStorage.setItem(key, content);
      }
      
      // Add to pending changes list
      this.addToPendingChangesList(projectId, fileId);
    } catch (error) {
      console.error('Error saving pending change:', error);
    }
  }
  
  loadPendingChange(projectId: string, fileId: string): string | null {
    try {
      if (!projectId || !fileId) return null;
      
      if (this.isAsyncStorage) {
        // AsyncStorage is asynchronous, so this would be more complex
        // For simplicity, we'll return null in this case
        console.warn('loadPendingChange sync method not supported with AsyncStorage');
        return null;
      }
      
      return localStorage.getItem(`pending_change_${projectId}_${fileId}`);
    } catch (error) {
      console.error('Error loading pending change:', error);
      return null;
    }
  }
  
  clearPendingChange(projectId: string, fileId: string): void {
    try {
      if (!projectId || !fileId) return;
      
      const key = `pending_change_${projectId}_${fileId}`;
      
      if (this.isAsyncStorage) {
        AsyncStorage.removeItem(key).catch(err => {
          console.error('Error clearing pending change:', err);
        });
      } else {
        localStorage.removeItem(key);
      }
      
      // Remove from pending changes list
      this.removeFromPendingChangesList(projectId, fileId);
    } catch (error) {
      console.error('Error clearing pending change:', error);
    }
  }
  
  // Pending changes list management
  private async addToPendingChangesList(projectId: string, fileId: string): Promise<void> {
    try {
      const pendingChanges = await this.getPendingChangesList();
      const key = `${projectId}_${fileId}`;
      
      if (!pendingChanges.includes(key)) {
        pendingChanges.push(key);
        await this.savePendingChangesList(pendingChanges);
      }
    } catch (error) {
      console.error('Error adding to pending changes list:', error);
    }
  }
  
  private async removeFromPendingChangesList(projectId: string, fileId: string): Promise<void> {
    try {
      const pendingChanges = await this.getPendingChangesList();
      const key = `${projectId}_${fileId}`;
      const updatedList = pendingChanges.filter(k => k !== key);
      
      await this.savePendingChangesList(updatedList);
    } catch (error) {
      console.error('Error removing from pending changes list:', error);
    }
  }
  
  private async getPendingChangesList(): Promise<string[]> {
    try {
      const key = 'pending_changes_list';
      let value;
      
      if (this.isAsyncStorage) {
        value = await AsyncStorage.getItem(key);
      } else {
        value = localStorage.getItem(key);
      }
      
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting pending changes list:', error);
      return [];
    }
  }
  
  private async savePendingChangesList(pendingChanges: string[]): Promise<void> {
    try {
      const key = 'pending_changes_list';
      const value = JSON.stringify(pendingChanges);
      
      if (this.isAsyncStorage) {
        await AsyncStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving pending changes list:', error);
    }
  }
  
  // Get all pending changes for sync
  getAllPendingChanges(): { projectId: string, fileId: string, content: string, synced?: boolean }[] {
    try {
      if (this.isAsyncStorage) {
        console.warn('getAllPendingChanges sync method not supported with AsyncStorage');
        return [];
      }
      
      const pendingChangesStr = localStorage.getItem('pending_changes_list');
      const pendingChangeKeys = pendingChangesStr ? JSON.parse(pendingChangesStr) : [];
      const results: { projectId: string, fileId: string, content: string, synced?: boolean }[] = [];
      
      for (const key of pendingChangeKeys) {
        const [projectId, fileId] = key.split('_');
        const content = localStorage.getItem(`pending_change_${key}`);
        
        if (content) {
          results.push({ projectId, fileId, content });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error getting all pending changes:', error);
      return [];
    }
  }
  
  // Clear all storage (for logout or reset)
  async clearAllStorage(): Promise<void> {
    try {
      if (this.isAsyncStorage) {
        await AsyncStorage.clear();
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
  
  // Get last sync timestamp
  getLastSync(): number {
    try {
      if (this.isAsyncStorage) {
        console.warn('getLastSync sync method not supported with AsyncStorage');
        return 0;
      }
      
      const value = localStorage.getItem('last_sync_timestamp');
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error getting last sync timestamp:', error);
      return 0;
    }
  }
  
  // Save last sync timestamp
  saveLastSync(timestamp: number = Date.now()): void {
    try {
      const key = 'last_sync_timestamp';
      const value = timestamp.toString();
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error saving last sync timestamp:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error saving last sync timestamp:', error);
    }
  }
  
  // Get storage used in bytes
  getStorageUsed(): number {
    try {
      if (this.isAsyncStorage) {
        console.warn('getStorageUsed sync method not supported with AsyncStorage');
        return 0;
      }
      
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key) || '';
          totalSize += key.length + value.length;
        }
      }
      
      // Convert from characters to bytes (approximation)
      return totalSize * 2;
    } catch (error) {
      console.error('Error calculating storage used:', error);
      return 0;
    }
  }
  
  // Get storage capacity in bytes
  getStorageCapacity(): number {
    try {
      // Most browsers have a limit of 5-10 MB, but we'll use a conservative estimate
      // This is just an approximation as there's no reliable way to get the exact limit
      return 5 * 1024 * 1024; // 5 MB in bytes
    } catch (error) {
      console.error('Error getting storage capacity:', error);
      return 5 * 1024 * 1024; // Default to 5 MB
    }
  }
  
  // Load pending changes with sync status
  loadPendingChanges(): { projectId: string, fileId: string, content: string, synced: boolean }[] {
    try {
      if (this.isAsyncStorage) {
        console.warn('loadPendingChanges sync method not supported with AsyncStorage');
        return [];
      }
      
      const pendingChangesStr = localStorage.getItem('pending_changes_list');
      const pendingChangeKeys = pendingChangesStr ? JSON.parse(pendingChangesStr) : [];
      const results: { projectId: string, fileId: string, content: string, synced: boolean }[] = [];
      
      for (const key of pendingChangeKeys) {
        const [projectId, fileId] = key.split('_');
        const content = localStorage.getItem(`pending_change_${key}`);
        const syncStatus = localStorage.getItem(`sync_status_${key}`) || 'false';
        const synced = syncStatus === 'true';
        
        if (content) {
          results.push({ 
            projectId, 
            fileId, 
            content,
            synced
          });
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error loading pending changes:', error);
      return [];
    }
  }
  
  // Update sync status for a pending change
  updateSyncStatus(projectId: string, fileId: string, synced: boolean): void {
    try {
      if (!projectId || !fileId) return;
      
      const key = `sync_status_${projectId}_${fileId}`;
      const value = synced.toString();
      
      if (this.isAsyncStorage) {
        AsyncStorage.setItem(key, value).catch(err => {
          console.error('Error updating sync status:', err);
        });
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
    }
  }
}

// Create a singleton instance
const localStorageService = new LocalStorageService();
export default localStorageService;