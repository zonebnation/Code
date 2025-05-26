import { supabase } from '../lib/supabase-init';
import LocalStorageService from './LocalStorageService';
import ProjectService from './ProjectService';

type OfflineChangeListener = (offline: boolean) => void;
type SyncStatusListener = (syncing: boolean) => void;

class SyncService {
  private offlineMode: boolean = false;
  private syncing: boolean = false;
  private syncInterval: NodeJS.Timer | null = null;
  private offlineListeners: OfflineChangeListener[] = [];
  private syncListeners: SyncStatusListener[] = [];

  constructor() {
    // Check online status when the service is initialized
    this.offlineMode = !navigator.onLine;
    
    // Set up network status listeners
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Set up automatic sync every 5 minutes if online
    this.setupAutoSync();
  }

  private handleOnline = () => {
    if (this.offlineMode) {
      this.offlineMode = false;
      this.notifyOfflineListeners();
      
      // Try to sync pending changes
      this.syncPendingChanges();
    }
  };

  private handleOffline = () => {
    if (!this.offlineMode) {
      this.offlineMode = true;
      this.notifyOfflineListeners();
    }
  };
  
  private notifyOfflineListeners() {
    this.offlineListeners.forEach(listener => {
      listener(this.offlineMode);
    });
  }
  
  private notifySyncListeners() {
    this.syncListeners.forEach(listener => {
      listener(this.syncing);
    });
  }
  
  private setupAutoSync() {
    // Clear existing interval if any
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Set up new interval (5 minutes)
    this.syncInterval = setInterval(() => {
      if (!this.offlineMode && !this.syncing) {
        this.syncPendingChanges();
      }
    }, 5 * 60 * 1000);
  }

  // Public methods
  isOffline(): boolean {
    return this.offlineMode;
  }
  
  isSyncing(): boolean {
    return this.syncing;
  }
  
  setOfflineMode(offline: boolean): void {
    if (this.offlineMode !== offline) {
      this.offlineMode = offline;
      this.notifyOfflineListeners();
      
      // If coming back online, try to sync
      if (!offline) {
        this.syncPendingChanges();
      }
    }
  }
  
  onOfflineStatusChange(listener: OfflineChangeListener): void {
    this.offlineListeners.push(listener);
  }
  
  removeOfflineListener(listener: OfflineChangeListener): void {
    this.offlineListeners = this.offlineListeners.filter(l => l !== listener);
  }
  
  onSyncStatusChange(listener: SyncStatusListener): void {
    this.syncListeners.push(listener);
  }
  
  removeSyncListener(listener: SyncStatusListener): void {
    this.syncListeners = this.syncListeners.filter(l => l !== listener);
  }
  
  async forceSyncNow(): Promise<void> {
    if (this.offlineMode) {
      throw new Error('Cannot sync while in offline mode');
    }
    
    if (this.syncing) {
      throw new Error('Sync already in progress');
    }
    
    await this.syncPendingChanges();
  }
  
  private async syncPendingChanges(): Promise<void> {
    if (this.offlineMode) return;
    
    try {
      this.syncing = true;
      this.notifySyncListeners();
      
      // Get all pending changes
      const pendingChanges = LocalStorageService.getAllPendingChanges();
      
      if (pendingChanges.length === 0) {
        return;
      }
      
      // Process each change
      for (const change of pendingChanges) {
        try {
          await ProjectService.updateFile(change.fileId, change.content);
          
          // Clear the pending change if successful
          LocalStorageService.clearPendingChange(change.projectId, change.fileId);
        } catch (error) {
          console.error(`Error syncing change for file ${change.fileId}:`, error);
          // Leave the pending change in place to try again later
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncing = false;
      this.notifySyncListeners();
    }
  }
  
  cleanup() {
    // Clean up event listeners and intervals
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
}

// Create a singleton instance
const syncService = new SyncService();
export default syncService;