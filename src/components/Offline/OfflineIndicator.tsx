import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import SyncService from '../../services/SyncService';
import { WifiOff, ArrowUpDown, Check } from 'lucide-react';
import styles from './OfflineIndicator.module.css';

const OfflineIndicator: React.FC = () => {
  const { colors } = useTheme();
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showToggleOptions, setShowToggleOptions] = useState(false);

  // Listen for offline status changes
  useEffect(() => {
    const handleOfflineChange = (offline: boolean) => {
      setIsOffline(offline);
    };

    const handleSyncChange = (syncing: boolean) => {
      setIsSyncing(syncing);
      
      // Show success message briefly after sync completes
      if (!syncing) {
        setShowSuccessMessage(true);
        const timer = setTimeout(() => {
          setShowSuccessMessage(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    };

    SyncService.onOfflineStatusChange(handleOfflineChange);
    SyncService.onSyncStatusChange(handleSyncChange);

    return () => {
      SyncService.removeOfflineListener(handleOfflineChange);
      SyncService.removeSyncListener(handleSyncChange);
    };
  }, []);

  // Don't show anything if we're online and not syncing
  if (!isOffline && !isSyncing && !showSuccessMessage) {
    return null;
  }

  // Force a sync when the user clicks the sync button
  const handleSync = async () => {
    await SyncService.forceSyncNow();
  };

  // Toggle offline mode
  const handleToggleOfflineMode = () => {
    SyncService.setOfflineMode(!isOffline);
    setShowToggleOptions(false);
  };

  return (
    <div className={styles.container}>
      {showToggleOptions && (
        <div 
          className={styles.toggleOptions}
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border
          }}
        >
          <button
            className={styles.toggleOption}
            onClick={handleToggleOfflineMode}
          >
            <span style={{ color: colors.text }}>
              {isOffline ? 'Switch to Online Mode' : 'Switch to Offline Mode'}
            </span>
          </button>
        </div>
      )}
      
      <div 
        className={`${styles.indicator} ${showSuccessMessage ? styles.success : ''}`}
        style={{
          backgroundColor: showSuccessMessage 
            ? colors.success 
            : isOffline 
              ? colors.warning 
              : colors.primary
        }}
        onClick={() => setShowToggleOptions(!showToggleOptions)}
      >
        {showSuccessMessage ? (
          <>
            <Check size={14} color="#FFFFFF" />
            <span>Synced</span>
          </>
        ) : isOffline ? (
          <>
            <WifiOff size={14} color="#FFFFFF" />
            <span>Offline</span>
          </>
        ) : (
          <>
            <ArrowUpDown size={14} color="#FFFFFF" className={styles.syncingIcon} />
            <span>Syncing</span>
          </>
        )}
      </div>
      
      {isOffline && !showToggleOptions && (
        <button
          className={styles.syncButton}
          onClick={handleSync}
          disabled={isSyncing}
          style={{
            backgroundColor: colors.primary,
            opacity: isSyncing ? 0.7 : 1
          }}
        >
          <ArrowUpDown size={14} color="#FFFFFF" className={isSyncing ? styles.syncingIcon : ''} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      )}
    </div>
  );
};

export default OfflineIndicator;