import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  User, 
  Clock, 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  Edit, 
  ShieldAlert 
} from 'lucide-react';
import styles from './InvitationCard.module.css';

type Invitation = {
  id: string;
  project_id: string;
  project_name: string;
  inviter_id: string;
  inviter_username: string | null;
  inviter_avatar_url: string | null;
  permission: 'read' | 'write' | 'admin';
  created_at: string;
};

interface InvitationCardProps {
  invitation: Invitation;
  onAccept: () => void;
  onReject: () => void;
}

const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onReject
}) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle accepting invitation
  const handleAccept = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update invitation status to accepted
      const { error: updateError } = await supabase
        .from('collaboration_invites')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);
      
      if (updateError) throw updateError;
      
      // Notify parent component
      onAccept();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      setError('Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle rejecting invitation
  const handleReject = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Update invitation status to rejected
      const { error: updateError } = await supabase
        .from('collaboration_invites')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);
      
      if (updateError) throw updateError;
      
      // Notify parent component
      onReject();
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      setError('Failed to reject invitation');
    } finally {
      setLoading(false);
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get permission icon
  const getPermissionIcon = () => {
    switch (invitation.permission) {
      case 'admin':
        return <ShieldAlert size={14} color={colors.warning} />;
      case 'write':
        return <Edit size={14} color={colors.primary} />;
      case 'read':
      default:
        return <Eye size={14} color={colors.textSecondary} />;
    }
  };
  
  // Get permission text
  const getPermissionText = () => {
    switch (invitation.permission) {
      case 'admin':
        return 'Administrator access';
      case 'write':
        return 'Edit access';
      case 'read':
      default:
        return 'View access';
    }
  };
  
  return (
    <div 
      className={styles.card}
      style={{ 
        backgroundColor: colors.surface,
        borderColor: colors.border
      }}
    >
      {/* Header with project name */}
      <div className={styles.header}>
        <h3 style={{ color: colors.text }}>
          {invitation.project_name}
        </h3>
        <div 
          className={styles.date}
          style={{ color: colors.textSecondary }}
        >
          <Clock size={12} />
          <span>{formatDate(invitation.created_at)}</span>
        </div>
      </div>
      
      {/* Inviter info */}
      <div className={styles.inviter}>
        <div 
          className={styles.avatar}
          style={{ backgroundColor: `${colors.primary}20` }}
        >
          {invitation.inviter_avatar_url ? (
            <img src={invitation.inviter_avatar_url} alt={invitation.inviter_username || 'User'} />
          ) : (
            <User size={16} color={colors.primary} />
          )}
        </div>
        <div className={styles.inviterInfo}>
          <span style={{ color: colors.text }}>
            {invitation.inviter_username || 'Unknown user'} invited you
          </span>
          <div 
            className={styles.permission}
            style={{ color: invitation.permission === 'admin' ? colors.warning : colors.primary }}
          >
            {getPermissionIcon()}
            <span>{getPermissionText()}</span>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div 
          className={styles.error}
          style={{ color: colors.error }}
        >
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
      
      {/* Action buttons */}
      <div className={styles.actions}>
        <button 
          className={styles.rejectButton}
          onClick={handleReject}
          disabled={loading}
          style={{ color: colors.error, borderColor: colors.error }}
        >
          <X size={14} />
          <span>Decline</span>
        </button>
        <button 
          className={styles.acceptButton}
          onClick={handleAccept}
          disabled={loading}
          style={{ backgroundColor: colors.primary }}
        >
          <Check size={14} color="#FFFFFF" />
          <span>Accept</span>
        </button>
      </div>
    </div>
  );
};

export default InvitationCard;