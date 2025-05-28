import { supabase } from '../lib/supabase-init';
import { EditorSettings, ColorTheme } from '../context/SettingsContext';
import { KeyCombo } from './KeyBindingsService';

// Types for all syncable settings
export interface UserSettings {
  editorSettings?: EditorSettings;
  colorTheme?: ColorTheme;
  isDark?: boolean;
  keyBindings?: Record<string, KeyCombo>;
  syncEnabled?: boolean;
  lastSyncTime?: number;
  [key: string]: any; // <-- Add this line
}

// Result of a sync operation
export interface SyncResult {
  success: boolean;
  error?: string;
  conflicts?: string[];
  timestamp?: number;
}

// Settings sync status
export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

class SettingsSyncService {
  private syncStatus: SyncStatus = 'idle';
  private lastSyncTime: number = 0;
  private statusListeners: ((status: SyncStatus) => void)[] = [];

  // Save a specific setting to the database
  async saveSetting(key: string, value: any): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Cannot save settings: User not authenticated');
        return false;
      }

      // Update sync status
      this.setSyncStatus('syncing');

      // Check if the setting already exists
      const { data: existingData, error: fetchError } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('key', key)
        .maybeSingle();

      if (fetchError) {
        console.error('Error checking existing setting:', fetchError);
        this.setSyncStatus('error');
        return false;
      }

      let result;
      if (existingData) {
        // Update existing setting
        result = await supabase
          .from('user_settings')
          .update({
            value,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
      } else {
        // Insert new setting
        result = await supabase
          .from('user_settings')
          .insert({
            user_id: session.user.id,
            key,
            value
          });
      }

      if (result.error) {
        console.error('Error saving setting:', result.error);
        this.setSyncStatus('error');
        return false;
      }

      // Update last sync time
      this.lastSyncTime = Date.now();
      this.setSyncStatus('success');
      return true;
    } catch (error) {
      console.error('Error in saveSetting:', error);
      this.setSyncStatus('error');
      return false;
    }
  }

  // Load a specific setting from the database
  async loadSetting<T>(key: string): Promise<T | null> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Cannot load settings: User not authenticated');
        return null;
      }

      // Update sync status
      this.setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('user_settings')
        .select('value')
        .eq('user_id', session.user.id)
        .eq('key', key)
        .maybeSingle();

      if (error) {
        console.error('Error loading setting:', error);
        this.setSyncStatus('error');
        return null;
      }

      if (!data) {
        // Setting not found
        this.setSyncStatus('idle');
        return null;
      }

      // Update last sync time
      this.lastSyncTime = Date.now();
      this.setSyncStatus('success');
      return data.value as T;
    } catch (error) {
      console.error('Error in loadSetting:', error);
      this.setSyncStatus('error');
      return null;
    }
  }

  // Save all settings at once
  async saveAllSettings(settings: UserSettings): Promise<SyncResult> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return {
          success: false,
          error: 'User not authenticated'
        };
      }

      // Update sync status
      this.setSyncStatus('syncing');

      // Save each setting separately
      const promises = Object.entries(settings).map(([key, value]) => 
        this.saveSetting(key, value)
      );

      // Wait for all saves to complete
      const results = await Promise.all(promises);

      // Check if all saves were successful
      const allSucceeded = results.every(Boolean);

      // Update last sync time
      this.lastSyncTime = Date.now();
      
      if (allSucceeded) {
        // Save the last sync timestamp
        await this.saveSetting('lastSyncTime', this.lastSyncTime);
        this.setSyncStatus('success');
        
        return {
          success: true,
          timestamp: this.lastSyncTime
        };
      } else {
        this.setSyncStatus('error');
        return {
          success: false,
          error: 'Failed to save some settings'
        };
      }
    } catch (error) {
      console.error('Error in saveAllSettings:', error);
      this.setSyncStatus('error');
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Load all settings at once
  async loadAllSettings(): Promise<UserSettings | null> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Cannot load settings: User not authenticated');
        return null;
      }

      // Update sync status
      this.setSyncStatus('syncing');

      const { data, error } = await supabase
        .from('user_settings')
        .select('key, value')
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error loading settings:', error);
        this.setSyncStatus('error');
        return null;
      }

      if (!data || data.length === 0) {
        // No settings found
        this.setSyncStatus('idle');
        return {};
      }

      // Convert array of settings to object
      const settings: UserSettings = {};
      for (const item of data) {
        settings[item.key as keyof UserSettings] = item.value;
      }

      // Update last sync time
      this.lastSyncTime = settings.lastSyncTime || Date.now();
      this.setSyncStatus('success');
      
      return settings;
    } catch (error) {
      console.error('Error in loadAllSettings:', error);
      this.setSyncStatus('error');
      return null;
    }
  }

  // Delete all settings
  async deleteAllSettings(): Promise<boolean> {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('Cannot delete settings: User not authenticated');
        return false;
      }

      // Update sync status
      this.setSyncStatus('syncing');

      const { error } = await supabase
        .from('user_settings')
        .delete()
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting settings:', error);
        this.setSyncStatus('error');
        return false;
      }

      this.lastSyncTime = 0;
      this.setSyncStatus('success');
      return true;
    } catch (error) {
      console.error('Error in deleteAllSettings:', error);
      this.setSyncStatus('error');
      return false;
    }
  }

  // Merge local and remote settings, with resolution strategy
  mergeSettings(
    local: UserSettings, 
    remote: UserSettings, 
    strategy: 'remote-wins' | 'local-wins' | 'newest-wins' = 'newest-wins'
  ): UserSettings {
    // Start with a copy of local settings
    const merged: UserSettings = { ...local };
    const conflicts: string[] = [];

    // For each remote setting
    for (const [key, remoteValue] of Object.entries(remote)) {
      const localValue = local[key as keyof UserSettings];
      
      // If the key doesn't exist locally, use remote
      if (localValue === undefined) {
        merged[key as keyof UserSettings] = remoteValue;
        continue;
      }

      // If values are identical, no conflict
      if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
        continue;
      }

      // Handle conflict based on strategy
      switch (strategy) {
        case 'remote-wins':
          merged[key as keyof UserSettings] = remoteValue;
          conflicts.push(key);
          break;
        case 'local-wins':
          // Keep local value
          conflicts.push(key);
          break;
        case 'newest-wins':
          // This would require timestamps for each setting
          // For simplicity we'll use remote as "newer" in this implementation
          merged[key as keyof UserSettings] = remoteValue;
          conflicts.push(key);
          break;
      }
    }

    return merged;
  }

  // Get the current sync status
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  // Set the sync status and notify listeners
  private setSyncStatus(status: SyncStatus): void {
    this.syncStatus = status;
    
    // Notify all listeners
    this.statusListeners.forEach(listener => listener(status));
  }

  // Register a listener for sync status changes
  onSyncStatusChange(listener: (status: SyncStatus) => void): void {
    this.statusListeners.push(listener);
  }

  // Remove a listener
  offSyncStatusChange(listener: (status: SyncStatus) => void): void {
    this.statusListeners = this.statusListeners.filter(l => l !== listener);
  }

  // Get the last sync time
  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  // Check if settings sync is enabled for the current user
  async isSyncEnabled(): Promise<boolean> {
    const syncEnabled = await this.loadSetting<boolean>('syncEnabled');
    return syncEnabled === true;
  }

  // Enable or disable settings sync
  async setSyncEnabled(enabled: boolean): Promise<boolean> {
    return await this.saveSetting('syncEnabled', enabled);
  }
}

export default new SettingsSyncService();