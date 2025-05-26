import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase-init';
import { Bell, MailOpen } from 'lucide-react';
import InvitationCard from './InvitationCard';
import styles from './InvitationsList.module.css';

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

const InvitationsList: React.FC = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<any>(null);
  
  // Fetch invitations when component mounts
  useEffect(() => {
    if (user) {
      fetchInvitations();
      setupRealtimeSubscription();
      
      return () => {
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
      };
    }
  }, [user]);
  
  // Fetch pending invitations
  const fetchInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('collaboration_invites')
        .select(`
          id,
          project_id,
          permission,
          status,
          created_at,
          inviter:inviter_id (id, username, avatar_url),
          project:project_id (name)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Format invitations
      const formattedInvitations: Invitation[] = data.map(invite => ({
        id: invite.id,
        project_id: invite.project_id,
        project_name: invite.project.name,
        inviter_id: invite.inviter.id,
        inviter_username: invite.inviter.username,
        inviter_avatar_url: invite.inviter.avatar_url,
        permission: invite.permission as 'read' | 'write' | 'admin',
        created_at: invite.created_at
      }));
      
      setInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };
  
  // Set up realtime subscription for invitations
  const setupRealtimeSubscription = () => {
    if (!user) return;
    
    const invitationsChannel = supabase
      .channel('invitations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_invites',
          filter: `invitee_id=eq.${user.id}`
        },
        () => fetchInvitations()
      )
      .subscribe();
    
    // Store the channel reference for cleanup
    channelRef.current = invitationsChannel;
  };
  
  // Handle accepting invitation
  const handleAcceptInvitation = (invitationId: string) => {
    setInvitations(prev => 
      prev.filter(invite => invite.id !== invitationId)
    );
  };
  
  // Handle rejecting invitation
  const handleRejectInvitation = (invitationId: string) => {
    setInvitations(prev => 
      prev.filter(invite => invite.id !== invitationId)
    );
  };
  
  // If there are no invitations, don't render anything
  if (invitations.length === 0 && !loading) {
    return null;
  }
  
  return (
    <div 
      className={styles.container}
      style={{ backgroundColor: colors.background }}
    >
      <div 
        className={styles.header}
        style={{ 
          backgroundColor: colors.surface,
          borderBottomColor: colors.border
        }}
      >
        <div className={styles.title}>
          <Bell size={16} color={colors.primary} />
          <h2 style={{ color: colors.text }}>
            Project Invitations
          </h2>
        </div>
      </div>
      
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loading} style={{ color: colors.textSecondary }}>
            Loading invitations...
          </div>
        ) : error ? (
          <div className={styles.error} style={{ color: colors.error }}>
            {error}
          </div>
        ) : invitations.length === 0 ? (
          <div className={styles.empty} style={{ color: colors.textSecondary }}>
            <MailOpen size={24} />
            <p>No pending invitations</p>
          </div>
        ) : (
          <div className={styles.invitationsList}>
            {invitations.map(invitation => (
              <InvitationCard 
                key={invitation.id}
                invitation={invitation}
                onAccept={() => handleAcceptInvitation(invitation.id)}
                onReject={() => handleRejectInvitation(invitation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsList;