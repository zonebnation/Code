import React, { useEffect, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import SettingsSyncService, { SyncStatus } from '../../services/SettingsSyncService';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SyncStatusIndicator: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Listen for sync status changes
  useEffect(() => {
    const checkSyncEnabled = async () => {
      if (!user) {
        setSyncEnabled(false);
        return;
      }

      try {
        const enabled = await SettingsSyncService.isSyncEnabled();
        setSyncEnabled(enabled);
      } catch (error) {
        console.error('Error checking sync enabled:', error);
      }
    };

    checkSyncEnabled();

    const handleSyncStatusChange = (status: SyncStatus) => {
      setSyncStatus(status);
    };

    SettingsSyncService.onSyncStatusChange(handleSyncStatusChange);
    
    return () => {
      SettingsSyncService.offSyncStatusChange(handleSyncStatusChange);
    };
  }, [user]);

  // Don't render if user is not logged in
  if (!user) {
    return null;
  }

  // Render nothing if sync is disabled and not syncing
  if (!syncEnabled && syncStatus !== 'syncing') {
    return null;
  }

  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      <button
        onClick={() => navigate('/settings/sync')}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          position: 'relative',
        }}
      >
        {syncStatus === 'syncing' ? (
          <RefreshCw 
            size={18} 
            color={colors.primary} 
            style={{ animation: 'spin 1.2s linear infinite' }}
          />
        ) : syncEnabled ? (
          <Cloud size={18} color={colors.primary} />
        ) : (
          <CloudOff size={18} color={colors.textSecondary} />
        )}
        
        {/* Status indicator dot */}
        {syncStatus === 'error' && (
          <div 
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.error,
              border: `2px solid ${colors.surface}`
            }}
          />
        )}
        
        {syncStatus === 'success' && (
          <div 
            style={{
              position: 'absolute',
              top: '5px',
              right: '5px',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: colors.success,
              border: `2px solid ${colors.surface}`,
              animation: 'fadeOut 2s forwards'
            }}
          />
        )}
      </button>
      
      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.surface,
            borderRadius: '4px',
            padding: '6px 12px',
            fontSize: '12px',
            color: colors.text,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            whiteSpace: 'nowrap',
            zIndex: 100,
            marginBottom: '8px'
          }}
        >
          {syncStatus === 'syncing' ? 'Syncing settings...' :
           syncStatus === 'error' ? 'Sync error' :
           syncStatus === 'success' ? 'Settings synced' :
           syncEnabled ? 'Settings sync enabled' : 'Settings sync disabled'}
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeOut {
          0% { opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}} />
    </div>
  );
};

export default SyncStatusIndicator;