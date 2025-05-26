import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import SettingsSyncService, { SyncStatus, SyncResult } from '../../services/SettingsSyncService';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  Clock, 
  Download, 
  Upload, 
  Settings, 
  HelpCircle,
  Trash
} from 'lucide-react';

const SettingsSync: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { 
    editorSettings, 
    colorTheme, 
    isDark,
    updateFontSize,
    updateTabSize,
    updateUseTabs,
    updateWordWrap,
    updateAutoSave,
    updateMinimapEnabled,
    updateColorTheme
  } = useSettings();
  
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'upload' | 'download' | 'delete' | null>(null);

  // Load initial sync state
  useEffect(() => {
    const loadSyncState = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if sync is enabled
        const enabled = await SettingsSyncService.isSyncEnabled();
        setSyncEnabled(enabled);

        // Get last sync time
        const time = SettingsSyncService.getLastSyncTime();
        setLastSyncTime(time);
      } catch (error) {
        console.error('Error loading sync state:', error);
        setSyncError('Failed to load sync settings');
      } finally {
        setIsLoading(false);
      }
    };

    loadSyncState();

    // Listen for sync status changes
    const statusListener = (status: SyncStatus) => {
      setSyncStatus(status);
      if (status === 'error') {
        setSyncError('Sync operation failed. Please try again.');
      } else if (status === 'success') {
        setSyncError(null);
      }
    };

    SettingsSyncService.onSyncStatusChange(statusListener);

    return () => {
      SettingsSyncService.offSyncStatusChange(statusListener);
    };
  }, [user]);

  // Format date for display
  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else {
      return 'Just now';
    }
  };

  // Toggle sync enabled state
  const handleToggleSyncEnabled = async () => {
    if (!user) return;
    
    try {
      const newSyncEnabled = !syncEnabled;
      await SettingsSyncService.setSyncEnabled(newSyncEnabled);
      setSyncEnabled(newSyncEnabled);
      
      if (newSyncEnabled) {
        // If enabling sync, immediately sync current settings
        await syncLocalToRemote();
      }
    } catch (error) {
      console.error('Error toggling sync enabled:', error);
      setSyncError('Failed to update sync settings');
    }
  };

  // Sync local settings to remote
  const syncLocalToRemote = async () => {
    if (!user) return;
    
    try {
      setShowConfirmation(false);
      setSyncError(null);
      
      // Get key bindings
      const customBindings: Record<string, any> = {};
      const allBindings = keyBindingsService.getAllBindings();
      
      allBindings.forEach(binding => {
        if (JSON.stringify(binding.currentKeyCombo) !== JSON.stringify(binding.defaultKeyCombo)) {
          customBindings[binding.id] = binding.currentKeyCombo;
        }
      });
      
      // Prepare settings object
      const settings = {
        editorSettings,
        colorTheme,
        isDark,
        keyBindings: customBindings,
        syncEnabled: true,
        lastSyncTime: Date.now()
      };
      
      // Upload to remote
      const result = await SettingsSyncService.saveAllSettings(settings);
      
      if (result.success) {
        setLastSyncTime(result.timestamp || Date.now());
        setSyncError(null);
      } else {
        setSyncError(result.error || 'Failed to upload settings');
      }
    } catch (error) {
      console.error('Error uploading settings:', error);
      setSyncError('Failed to upload settings to server');
    }
  };

  // Sync remote settings to local
  const syncRemoteToLocal = async () => {
    if (!user) return;
    
    try {
      setShowConfirmation(false);
      setSyncError(null);
      
      // Download from remote
      const remoteSettings = await SettingsSyncService.loadAllSettings();
      
      if (!remoteSettings) {
        setSyncError('No settings found on server');
        return;
      }
      
      // Apply settings to local state
      if (remoteSettings.editorSettings) {
        updateFontSize(remoteSettings.editorSettings.fontSize);
        updateTabSize(remoteSettings.editorSettings.tabSize);
        updateUseTabs(remoteSettings.editorSettings.useTabs);
        updateWordWrap(remoteSettings.editorSettings.wordWrap);
        updateAutoSave(remoteSettings.editorSettings.autoSave);
        updateMinimapEnabled(remoteSettings.editorSettings.minimapEnabled);
      }
      
      if (remoteSettings.colorTheme) {
        updateColorTheme(remoteSettings.colorTheme);
      }
      
      // Apply key bindings
      if (remoteSettings.keyBindings) {
        Object.entries(remoteSettings.keyBindings).forEach(([id, keyCombo]) => {
          keyBindingsService.updateBinding(id, keyCombo);
        });
      }
      
      // Update last sync time
      setLastSyncTime(remoteSettings.lastSyncTime || Date.now());
      setSyncError(null);
    } catch (error) {
      console.error('Error downloading settings:', error);
      setSyncError('Failed to download settings from server');
    }
  };

  // Delete all remote settings
  const deleteRemoteSettings = async () => {
    if (!user) return;
    
    try {
      setShowConfirmation(false);
      setSyncError(null);
      
      const success = await SettingsSyncService.deleteAllSettings();
      
      if (success) {
        setLastSyncTime(null);
        setSyncEnabled(false);
        setSyncError(null);
      } else {
        setSyncError('Failed to delete settings');
      }
    } catch (error) {
      console.error('Error deleting settings:', error);
      setSyncError('Failed to delete settings from server');
    }
  };

  // Ask for confirmation before proceeding with action
  const showConfirmationDialog = (action: 'upload' | 'download' | 'delete') => {
    setConfirmAction(action);
    setShowConfirmation(true);
  };

  // Handle confirmation dialog
  const handleConfirm = () => {
    if (confirmAction === 'upload') {
      syncLocalToRemote();
    } else if (confirmAction === 'download') {
      syncRemoteToLocal();
    } else if (confirmAction === 'delete') {
      deleteRemoteSettings();
    }
  };

  if (!user) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: colors.textSecondary 
      }}>
        Please sign in to use settings sync
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ 
        padding: '24px', 
        textAlign: 'center', 
        color: colors.textSecondary,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px'
      }}>
        <RefreshCw 
          size={24} 
          color={colors.primary} 
          style={{ animation: 'spin 1s linear infinite' }}
        />
        <div>Loading sync settings...</div>
        
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ 
        marginBottom: '24px', 
        backgroundColor: colors.surface,
        borderRadius: '8px',
        overflow: 'hidden'
      }}>
        {/* Sync toggle */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '16px',
            borderBottom: `1px solid ${colors.border}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {syncEnabled ? (
              <Cloud size={20} color={colors.primary} style={{ marginRight: '12px' }} />
            ) : (
              <CloudOff size={20} color={colors.textSecondary} style={{ marginRight: '12px' }} />
            )}
            <div>
              <span style={{ 
                color: colors.text, 
                fontSize: '16px', 
                display: 'block', 
                marginBottom: '4px' 
              }}>
                Settings Sync
              </span>
              <span style={{ 
                color: colors.textSecondary, 
                fontSize: '13px' 
              }}>
                {syncEnabled ? 
                  'Your settings are synced across devices' : 
                  'Enable to sync settings across devices'}
              </span>
            </div>
          </div>
          
          <label style={{
            position: 'relative',
            display: 'inline-block',
            width: '36px',
            height: '20px'
          }}>
            <input
              type="checkbox"
              checked={syncEnabled}
              onChange={handleToggleSyncEnabled}
              disabled={syncStatus === 'syncing'}
              style={{
                opacity: 0,
                width: 0,
                height: 0
              }}
            />
            <span style={{
              position: 'absolute',
              cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: syncEnabled ? colors.primary : colors.border,
              opacity: syncStatus === 'syncing' ? 0.6 : 1,
              borderRadius: '10px',
              transition: '.4s',
            }}>
              <span style={{
                position: 'absolute',
                content: '""',
                height: '16px',
                width: '16px',
                left: '2px',
                bottom: '2px',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: '.4s',
                transform: syncEnabled ? 'translateX(16px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>

        {/* Sync status */}
        {syncEnabled && (
          <>
            <div 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '16px',
                borderBottom: `1px solid ${colors.border}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Clock size={18} color={colors.textSecondary} style={{ marginRight: '12px' }} />
                <span style={{ color: colors.text }}>
                  Last synced
                </span>
              </div>
              
              <span style={{ color: colors.textSecondary }}>
                {formatDate(lastSyncTime)}
              </span>
            </div>

            {/* Sync actions */}
            <div 
              style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                padding: '16px',
                gap: '12px'
              }}
            >
              <button 
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: colors.surface,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  color: colors.text,
                  cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                  opacity: syncStatus === 'syncing' ? 0.6 : 1,
                }}
                onClick={() => showConfirmationDialog('download')}
                disabled={syncStatus === 'syncing'}
              >
                <Download size={16} color={colors.text} />
                <span>Download</span>
              </button>

              <button 
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px',
                  backgroundColor: colors.primary,
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                  opacity: syncStatus === 'syncing' ? 0.6 : 1,
                }}
                onClick={() => showConfirmationDialog('upload')}
                disabled={syncStatus === 'syncing'}
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw size={16} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Upload size={16} color="white" />
                )}
                <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Upload'}</span>
              </button>
            </div>

            {/* Delete settings button */}
            <div 
              style={{ 
                display: 'flex',
                justifyContent: 'center',
                padding: '0 16px 16px',
              }}
            >
              <button 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.error}`,
                  borderRadius: '4px',
                  color: colors.error,
                  cursor: syncStatus === 'syncing' ? 'not-allowed' : 'pointer',
                  opacity: syncStatus === 'syncing' ? 0.6 : 1,
                }}
                onClick={() => showConfirmationDialog('delete')}
                disabled={syncStatus === 'syncing'}
              >
                <Trash size={14} />
                <span>Delete Remote Settings</span>
              </button>
            </div>
          </>
        )}
        
        {/* Sync error */}
        {syncError && (
          <div style={{ 
            backgroundColor: `${colors.error}15`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: colors.error,
            marginTop: syncEnabled ? 0 : '16px',
            marginLeft: '16px',
            marginRight: '16px',
            marginBottom: '16px',
            borderRadius: '4px',
          }}>
            <AlertCircle size={16} style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500, marginBottom: '4px' }}>Sync Error</div>
              <div style={{ fontSize: '13px' }}>{syncError}</div>
            </div>
          </div>
        )}
        
        {/* Sync success message */}
        {syncStatus === 'success' && !syncError && (
          <div style={{ 
            backgroundColor: `${colors.success}15`,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: colors.success,
            marginTop: syncEnabled ? 0 : '16px',
            marginLeft: '16px',
            marginRight: '16px',
            marginBottom: '16px',
            borderRadius: '4px',
          }}>
            <Check size={16} style={{ marginTop: '2px' }} />
            <div>
              <div style={{ fontWeight: 500 }}>Settings synced successfully</div>
            </div>
          </div>
        )}
      </div>

      {/* Help information */}
      <div style={{ 
        backgroundColor: `${colors.primary}10`,
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '16px'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '8px',
          alignItems: 'flex-start'
        }}>
          <HelpCircle size={18} color={colors.primary} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <h3 style={{ 
              color: colors.text, 
              fontSize: '16px', 
              margin: '0 0 4px 0' 
            }}>
              About Settings Sync
            </h3>
            <p style={{ 
              color: colors.textSecondary, 
              fontSize: '14px', 
              margin: 0,
              lineHeight: 1.5
            }}>
              Settings Sync allows you to keep your editor preferences consistent across all devices where you use Code Canvas.
            </p>
          </div>
        </div>
        
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: `1px solid ${colors.border}`
        }}>
          <div style={{ fontSize: '14px', color: colors.text }}>
            The following settings are synced:
          </div>
          
          <ul style={{ 
            margin: 0,
            paddingLeft: '18px',
            color: colors.textSecondary,
            fontSize: '13px',
          }}>
            <li>Editor preferences (font size, tab size, word wrap, etc.)</li>
            <li>Theme selection and dark/light mode</li>
            <li>Custom keyboard shortcuts</li>
          </ul>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: colors.surface,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            width: '90%',
            maxWidth: '400px'
          }}>
            <h3 style={{ 
              color: colors.text, 
              margin: '0 0 16px 0',
              fontSize: '18px'
            }}>
              {confirmAction === 'delete' ? 'Delete Remote Settings' :
               confirmAction === 'download' ? 'Download Settings' :
               'Upload Settings'}
            </h3>

            <p style={{ 
              color: colors.textSecondary, 
              margin: '0 0 24px 0',
              fontSize: '14px',
              lineHeight: 1.5
            }}>
              {confirmAction === 'delete' ? 
                'This will permanently delete all your synced settings from the server. Your local settings will remain unchanged.' :
               confirmAction === 'download' ? 
                'This will overwrite your local settings with the settings from the server. Any unsaved local changes will be lost.' :
                'This will overwrite your remote settings with your current local settings.'}
            </p>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '4px',
                  color: colors.text,
                  cursor: 'pointer',
                  minHeight: '36px'
                }}
                onClick={() => setShowConfirmation(false)}
              >
                Cancel
              </button>
              
              <button
                style={{
                  padding: '8px 16px',
                  backgroundColor: confirmAction === 'delete' ? colors.error : colors.primary,
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer',
                  minHeight: '36px'
                }}
                onClick={handleConfirm}
              >
                {confirmAction === 'delete' ? 'Delete' :
                 confirmAction === 'download' ? 'Download' :
                 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// For now, we'll define a simple mock keyBindingsService for this component
// In a real implementation, you would import this from your actual KeyBindingsService
const keyBindingsService = {
  getAllBindings: () => {
    return [];
  },
  updateBinding: (id: string, keyCombo: any) => {
    return true;
  }
};

export default SettingsSync;