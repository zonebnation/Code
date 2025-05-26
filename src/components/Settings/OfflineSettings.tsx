import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { WifiOff, RefreshCw, Info, HardDrive, Database, Clock } from 'lucide-react';
import SyncService from '../../services/SyncService';
import LocalStorageService from '../../services/LocalStorageService';
import styles from './OfflineSettings.module.css';

const OfflineSettings: React.FC = () => {
  const { colors } = useTheme();
  const { 
    isOffline, 
    toggleOfflineMode, 
    syncOfflineChanges 
  } = useProject();
  
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  const [storageUsed, setStorageUsed] = useState<number>(0);
  const [storageCapacity, setStorageCapacity] = useState<number>(0);
  const [pendingChanges, setPendingChanges] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Load storage statistics when component mounts
  useEffect(() => {
    const loadStats = () => {
      // Get last sync time
      const lastSync = LocalStorageService.getLastSync();
      setLastSyncTime(lastSync);
      
      // Get storage used
      const used = LocalStorageService.getStorageUsed();
      setStorageUsed(used);
      
      // Get storage capacity
      const capacity = LocalStorageService.getStorageCapacity();
      setStorageCapacity(capacity);
      
      // Get pending changes
      const changes = LocalStorageService.loadPendingChanges();
      setPendingChanges(changes.filter(c => !c.synced).length);
    };
    
    loadStats();
    
    // Set up interval to update stats periodically
    const interval = setInterval(loadStats, 10000); // Every 10 seconds
    
    // Set up sync status listener
    const handleSyncChange = (syncing: boolean) => {
      setIsSyncing(syncing);
      
      // Update stats when sync finishes
      if (!syncing) {
        loadStats();
      }
    };
    
    SyncService.onSyncStatusChange(handleSyncChange);
    
    return () => {
      clearInterval(interval);
      SyncService.removeSyncListener(handleSyncChange);
    };
  }, []);
  
  // Format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format timestamp to date string
  const formatDate = (timestamp: number): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // Handle toggle offline mode
  const handleToggleOfflineMode = () => {
    toggleOfflineMode();
  };
  
  // Handle sync now
  const handleSyncNow = async () => {
    try {
      await syncOfflineChanges();
    } catch (error) {
      console.error('Error syncing changes:', error);
      alert('Failed to sync changes: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  return (
    <div className={styles.container}>
      <div 
        className={styles.header}
        style={{ borderBottomColor: colors.border }}
      >
        <WifiOff size={18} color={isOffline ? colors.warning : colors.textSecondary} />
        <h3 style={{ color: colors.text }}>Offline Mode</h3>
      </div>
      
      <div className={styles.settings}>
        <div className={styles.settingItem}>
          <div className={styles.settingInfo}>
            <div className={styles.settingLabel} style={{ color: colors.text }}>
              Offline Mode
            </div>
            <div className={styles.settingDescription} style={{ color: colors.textSecondary }}>
              {isOffline 
                ? 'Currently working offline. Changes will be synced when you go online.' 
                : 'Currently working online. Changes are synced automatically.'}
            </div>
          </div>
          
          <div className={styles.settingControl}>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={isOffline}
                onChange={handleToggleOfflineMode}
              />
              <span 
                className={styles.slider}
                style={{ 
                  backgroundColor: isOffline ? colors.warning : colors.border 
                }}
              ></span>
            </label>
          </div>
        </div>
        
        <div 
          className={styles.syncStatus}
          style={{ 
            backgroundColor: colors.background,
            borderColor: colors.border
          }}
        >
          <div className={styles.syncStatusItem}>
            <div className={styles.syncStatusLabel}>
              <Clock size={14} color={colors.textSecondary} />
              <span style={{ color: colors.text }}>Last Synced</span>
            </div>
            <div className={styles.syncStatusValue} style={{ color: colors.textSecondary }}>
              {formatDate(lastSyncTime)}
            </div>
          </div>
          
          <div className={styles.syncStatusItem}>
            <div className={styles.syncStatusLabel}>
              <Database size={14} color={colors.textSecondary} />
              <span style={{ color: colors.text }}>Pending Changes</span>
            </div>
            <div className={styles.syncStatusValue} style={{ color: colors.textSecondary }}>
              {pendingChanges} {pendingChanges === 1 ? 'change' : 'changes'}
            </div>
          </div>
          
          <div className={styles.syncStatusItem}>
            <div className={styles.syncStatusLabel}>
              <HardDrive size={14} color={colors.textSecondary} />
              <span style={{ color: colors.text }}>Local Storage</span>
            </div>
            <div className={styles.syncStatusValue} style={{ color: colors.textSecondary }}>
              {formatBytes(storageUsed)} / {formatBytes(storageCapacity)}
            </div>
          </div>
          
          <div className={styles.storageBar}>
            <div 
              className={styles.storageBarFill}
              style={{
                width: `${Math.min(100, (storageUsed / storageCapacity) * 100)}%`,
                backgroundColor: storageUsed > 0.8 * storageCapacity 
                  ? colors.error 
                  : storageUsed > 0.6 * storageCapacity 
                    ? colors.warning 
                    : colors.primary
              }}
            ></div>
          </div>
        </div>
        
        {!isOffline && pendingChanges > 0 && (
          <button
            className={styles.syncButton}
            onClick={handleSyncNow}
            disabled={isSyncing}
            style={{ 
              backgroundColor: colors.primary,
              opacity: isSyncing ? 0.7 : 1
            }}
          >
            <RefreshCw 
              size={16} 
              color="#FFFFFF" 
              className={isSyncing ? styles.spinningIcon : ''}
            />
            <span>{isSyncing ? 'Syncing...' : `Sync Now (${pendingChanges})`}</span>
          </button>
        )}
        
        <div 
          className={styles.infoBox}
          style={{ 
            backgroundColor: `${colors.primary}10`,
            color: colors.text
          }}
        >
          <Info size={16} color={colors.primary} />
          <div>
            <p>Offline mode allows you to work on your projects even without an internet connection.</p>
            <p>Changes are automatically synced when you go back online.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineSettings;