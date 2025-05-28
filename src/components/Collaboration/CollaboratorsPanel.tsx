import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import { 
  User, 
  UserPlus, 
  X, 
  Check, 
  Mail,
  Shield,
  ShieldAlert,
  Eye,
  Edit,
  Trash,
  AlertCircle,
  Users
} from 'lucide-react';
import styles from './CollaboratorsPanel.module.css';
import { RealtimeChannel } from '@supabase/supabase-js';

type Collaborator = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  permission: 'read' | 'write' | 'admin';
};

type Invitation = {
  id: string;
  invitee_id: string;
  invitee_username: string | null;
  invitee_avatar_url: string | null;
  permission: 'read' | 'write' | 'admin';
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
};

const CollaboratorsPanel: React.FC = () => {
  const { colors } = useTheme();
  const { currentProject } = useProject();
  const { user, profile } = useAuth();
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [pendingInvites, setPendingInvites] = useState<Invitation[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [canInvite, setCanInvite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'read' | 'write' | 'admin'>('read');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Load collaborators and pending invites when the project changes
  useEffect(() => {
    if (currentProject && user) {
      fetchCollaborators();
      setupRealtimeSubscriptions();
      
      // Check if current user is the project owner
      if (currentProject.user_id === user.id) {
        setIsOwner(true);
      }
      
      return () => {
        // Clean up subscriptions
        if (channelRef.current) {
          channelRef.current.unsubscribe();
        }
      };
    }
  }, [currentProject, user]);
  
  // Fetch pending invitations and shared projects
  const fetchCollaborators = async () => {
    if (!currentProject || !user) return;
    
    setLoading(true);
    
    try {
      // Get project collaborators
      const { data: collaboratorsData, error: collaboratorsError } = await supabase
        .from('project_collaborators')
        .select(`
          id,
          permission,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('project_id', currentProject.id);
      
      if (collaboratorsError) throw collaboratorsError;
      
      // Format collaborators data
      const formattedCollaborators: Collaborator[] = collaboratorsData.map((collab: any) => ({
        id: collab.profiles.id,
        username: collab.profiles.username,
        avatar_url: collab.profiles.avatar_url,
        permission: collab.permission as 'read' | 'write' | 'admin'
      }));
      
      setCollaborators(formattedCollaborators);
      
      // Check if current user is admin
      const currentUserCollab = formattedCollaborators.find(c => c.id === user.id);
      setIsAdmin(currentUserCollab?.permission === 'admin' || false);
      
      // Check if collaborators can invite others
      const { data: projectData } = await supabase
        .from('projects')
        .select('collaborators_can_invite')
        .eq('id', currentProject.id)
        .single();
      
      const collaboratorsCanInvite = projectData?.collaborators_can_invite || false;
      
      // User can invite if they're the owner, an admin, or a collaborator with write/admin
      // permissions and collaborators_can_invite is true
      setCanInvite(
        isOwner || 
        currentUserCollab?.permission === 'admin' ||
        (collaboratorsCanInvite && currentUserCollab?.permission === 'write')
      );
      
      // Get pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('collaboration_invites')
        .select(`
          id,
          permission,
          status,
          created_at,
          invitee:invitee_id (id, username, avatar_url)
        `)
        .eq('project_id', currentProject.id)
        .eq('status', 'pending');
      
      if (invitesError) throw invitesError;
      
      // Format invitations data
      const formattedInvites: Invitation[] = invitesData.map((invite: any) => ({
        id: invite.id,
        invitee_id: invite.invitee.id,
        invitee_username: invite.invitee.username,
        invitee_avatar_url: invite.invitee.avatar_url,
        permission: invite.permission as 'read' | 'write' | 'admin',
        status: invite.status as 'pending' | 'accepted' | 'rejected',
        created_at: invite.created_at
      }));
      
      setPendingInvites(formattedInvites);
      
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      setError('Failed to load collaborators');
    } finally {
      setLoading(false);
    }
  };

  // Set up Supabase realtime subscriptions
  const setupRealtimeSubscriptions = () => {
    if (!currentProject) return;
    
    // Subscribe to collaborators changes
    const subscription = supabase
      .channel('collaborators-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_collaborators',
          filter: `project_id=eq.${currentProject.id}`
        },
        () => fetchCollaborators()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collaboration_invites',
          filter: `project_id=eq.${currentProject.id}`
        },
        () => fetchCollaborators()
      )
      .subscribe();
    
    channelRef.current = subscription;
  };

  // Send an invitation to collaborate
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentProject || !user || !inviteEmail.trim()) return;
    
    setInviteLoading(true);
    setInviteError(null);
    
    try {
      // Check if the user exists by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', inviteEmail)
        .single();
      
      if (userError) {
        setInviteError('User not found with that email');
        return;
      }
      
      // Check if the user is already a collaborator
      const { data: existingCollabData } = await supabase
        .from('project_collaborators')
        .select('id')
        .eq('project_id', currentProject.id)
        .eq('user_id', userData.id)
        .single();
      
      if (existingCollabData) {
        setInviteError('This user is already a collaborator on this project');
        return;
      }
      
      // Check if there's already a pending invitation
      const { data: existingInviteData } = await supabase
        .from('collaboration_invites')
        .select('id')
        .eq('project_id', currentProject.id)
        .eq('invitee_id', userData.id)
        .eq('status', 'pending')
        .single();
      
      if (existingInviteData) {
        setInviteError('An invitation has already been sent to this user');
        return;
      }
      
      // Create the invitation
      const { error: inviteError } = await supabase
        .from('collaboration_invites')
        .insert({
          project_id: currentProject.id,
          inviter_id: user.id,
          invitee_id: userData.id,
          permission: invitePermission
        });
      
      if (inviteError) throw inviteError;
      
      // Reset form
      setInviteEmail('');
      setShowInviteForm(false);
      
      // Refresh data
      fetchCollaborators();
      
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      setInviteError(error.message);
    } finally {
      setInviteLoading(false);
    }
  };

  // Cancel a pending invitation
  const handleCancelInvite = async (inviteId: string) => {
    if (!currentProject || !user) return;
    
    try {
      const { error } = await supabase
        .from('collaboration_invites')
        .delete()
        .eq('id', inviteId);
      
      if (error) throw error;
      
      // Refresh data
      fetchCollaborators();
      
    } catch (error: any) {
      console.error('Error canceling invitation:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  // Remove a collaborator
  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!currentProject || !user || !canInvite) return;
    
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('project_id', currentProject.id)
        .eq('user_id', collaboratorId);
      
      if (error) throw error;
      
      // Refresh data
      fetchCollaborators();
      
    } catch (error: any) {
      console.error('Error removing collaborator:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  // Change a collaborator's permission level
  const handleChangePermission = async (collaboratorId: string, newPermission: 'read' | 'write' | 'admin') => {
    if (!currentProject || !user || !canInvite) return;
    
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({ permission: newPermission })
        .eq('project_id', currentProject.id)
        .eq('user_id', collaboratorId);
      
      if (error) throw error;
      
      // Refresh data
      fetchCollaborators();
      
    } catch (error: any) {
      console.error('Error changing permission:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };
  
  // Toggle whether collaborators can invite others
  const toggleCollaboratorsCanInvite = async () => {
    if (!currentProject || !isOwner) return;
    
    try {
      const { data } = await supabase
        .from('projects')
        .select('collaborators_can_invite')
        .eq('id', currentProject.id)
        .single();
      
      const currentValue = data?.collaborators_can_invite || false;
      
      const { error } = await supabase
        .from('projects')
        .update({ collaborators_can_invite: !currentValue })
        .eq('id', currentProject.id);
      
      if (error) throw error;
      
      // Refresh collaborators to update canInvite status
      fetchCollaborators();
      
    } catch (error: any) {
      console.error('Error updating project settings:', error);
      setError(error.message || 'An unexpected error occurred');
    }
  };

  // Get icon for permission level
  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'admin':
        return <ShieldAlert size={14} color={colors.warning} />;
      case 'write':
        return <Edit size={14} color={colors.primary} />;
      case 'read':
      default:
        return <Eye size={14} color={colors.textSecondary} />;
    }
  };

  // Get label for permission level
  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'Admin';
      case 'write':
        return 'Can edit';
      case 'read':
      default:
        return 'Can view';
    }
  };

  if (!currentProject || !user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Users size={16} color={colors.primary} />
          <h3 style={{ color: colors.text }}>Collaborators</h3>
        </div>
        
        {canInvite && (
          <button 
            className={styles.inviteButton}
            onClick={() => setShowInviteForm(true)}
            style={{
              backgroundColor: colors.primary,
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '20px',
              border: 'none',
              marginLeft: 'auto'
            }}
          >
            <UserPlus size={14} color="#FFFFFF" />
            <span>Invite</span>
          </button>
        )}
      </div>
      
      {error && (
        <div className={styles.error} style={{ color: colors.error }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
      
      {showInviteForm && (
        <div className={styles.inviteForm} style={{ backgroundColor: `${colors.primary}10` }}>
          <div className={styles.formHeader}>
            <h4 style={{ color: colors.text }}>Invite Collaborator</h4>
            <button
              className={styles.closeButton}
              onClick={() => setShowInviteForm(false)}
            >
              <X size={14} color={colors.textSecondary} />
            </button>
          </div>
          
          {inviteError && (
            <div className={styles.inviteError} style={{ color: colors.error }}>
              {inviteError}
            </div>
          )}
          
          <form onSubmit={handleInvite}>
            <div className={styles.formGroup}>
              <label style={{ color: colors.textSecondary }}>
                Email
              </label>
              <div className={styles.inputWrapper} style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                <Mail size={14} color={colors.textSecondary} />
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Collaborator's email"
                  required
                  style={{ color: colors.text }}
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label style={{ color: colors.textSecondary }}>
                Permission
              </label>
              <div className={styles.permissionOptions}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="permission"
                    value="read"
                    checked={invitePermission === 'read'}
                    onChange={() => setInvitePermission('read')}
                  />
                  <span style={{ color: colors.text }}>View</span>
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="permission"
                    value="write"
                    checked={invitePermission === 'write'}
                    onChange={() => setInvitePermission('write')}
                  />
                  <span style={{ color: colors.text }}>Edit</span>
                </label>
                {(isOwner || isAdmin) && (
                  <label className={styles.radioLabel}>
                    <input
                      type="radio"
                      name="permission"
                      value="admin"
                      checked={invitePermission === 'admin'}
                      onChange={() => setInvitePermission('admin')}
                    />
                    <span style={{ color: colors.text }}>Admin</span>
                  </label>
                )}
              </div>
            </div>
            
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowInviteForm(false)}
                style={{ borderColor: colors.border, color: colors.text }}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={styles.submitButton}
                disabled={inviteLoading || !inviteEmail.trim()}
                style={{ 
                  backgroundColor: colors.primary,
                  opacity: inviteLoading || !inviteEmail.trim() ? 0.7 : 1
                }}
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {loading ? (
        <div className={styles.loading} style={{ color: colors.textSecondary }}>
          Loading collaborators...
        </div>
      ) : (
        <>
          {/* Current collaborators */}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle} style={{ color: colors.text }}>
              People with access
            </h4>
            
            <div className={styles.collaboratorList}>
              {/* Project Owner */}
              <div className={styles.collaboratorItem}>
                <div className={styles.collaboratorInfo}>
                  <div className={styles.avatar} style={{ backgroundColor: `${colors.primary}30` }}>
                    {currentProject.user_id === user.id ? (
                      profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.username || 'Owner'} />
                      ) : (
                        <User size={16} color={colors.primary} />
                      )
                    ) : (
                      <User size={16} color={colors.primary} />
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.username} style={{ color: colors.text }}>
                      {currentProject.user_id === user.id ? 
                        (profile?.username || 'You') : 
                        'Project Owner'}
                    </div>
                    <div className={styles.permissionLabel}>
                      <Shield size={12} color={colors.success} />
                      <span style={{ color: colors.success }}>Owner</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Collaborators */}
              {collaborators.length > 0 ? (
                collaborators.map(collab => (
                  <div key={collab.id} className={styles.collaboratorItem}>
                    <div className={styles.collaboratorInfo}>
                      <div className={styles.avatar} style={{ backgroundColor: `${colors.primary}30` }}>
                        {collab.avatar_url ? (
                          <img src={collab.avatar_url} alt={collab.username || 'User'} />
                        ) : (
                          <User size={16} color={colors.primary} />
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.username} style={{ color: colors.text }}>
                          {collab.username || 'Unnamed User'}
                          {collab.id === user.id ? ' (You)' : ''}
                        </div>
                        <div className={styles.permissionLabel}>
                          {getPermissionIcon(collab.permission)}
                          <span style={{ 
                            color: collab.permission === 'admin' 
                              ? colors.warning 
                              : collab.permission === 'write' 
                                ? colors.primary 
                                : colors.textSecondary 
                          }}>
                            {getPermissionLabel(collab.permission)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions (only shown for owners and admins, or for own access) */}
                    {(isOwner || isAdmin || collab.id === user.id) && (
                      <div className={styles.collaboratorActions}>
                        {(isOwner || isAdmin) && collab.id !== user.id && (
                          <div className={styles.permissionDropdown}>
                            <select 
                              value={collab.permission}
                              onChange={(e) => handleChangePermission(collab.id, e.target.value as 'read' | 'write' | 'admin')}
                              style={{ 
                                borderColor: colors.border,
                                color: colors.text,
                                backgroundColor: colors.background
                              }}
                            >
                              <option value="read">View</option>
                              <option value="write">Edit</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                        )}
                        
                        {(isOwner || isAdmin || collab.id === user.id) && collab.id !== user.id && (
                          <button 
                            className={styles.removeButton}
                            onClick={() => handleRemoveCollaborator(collab.id)}
                            title="Remove collaborator"
                          >
                            <Trash size={14} color={colors.error} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState} style={{ color: colors.textSecondary }}>
                  No collaborators yet
                </div>
              )}
            </div>
          </div>
          
          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle} style={{ color: colors.text }}>
                Pending Invitations
              </h4>
              
              <div className={styles.inviteList}>
                {pendingInvites.map(invite => (
                  <div key={invite.id} className={styles.inviteItem}>
                    <div className={styles.inviteInfo}>
                      <div className={styles.avatar} style={{ backgroundColor: `${colors.primary}30` }}>
                        {invite.invitee_avatar_url ? (
                          <img src={invite.invitee_avatar_url} alt={invite.invitee_username || 'User'} />
                        ) : (
                          <User size={16} color={colors.primary} />
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <div className={styles.username} style={{ color: colors.text }}>
                          {invite.invitee_username || 'Unnamed User'}
                        </div>
                        <div className={styles.permissionLabel}>
                          {getPermissionIcon(invite.permission)}
                          <span style={{ 
                            color: invite.permission === 'admin' 
                              ? colors.warning 
                              : invite.permission === 'write' 
                                ? colors.primary 
                                : colors.textSecondary 
                          }}>
                            {getPermissionLabel(invite.permission)} (Pending)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.inviteActions}>
                      <button 
                        className={styles.cancelInviteButton}
                        onClick={() => handleCancelInvite(invite.id)}
                        title="Cancel invitation"
                      >
                        <X size={14} color={colors.error} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Settings section (only for project owner) */}
          {isOwner && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle} style={{ color: colors.text }}>
                Collaboration Settings
              </h4>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <div className={styles.settingLabel} style={{ color: colors.text }}>
                    Collaborators can invite others
                  </div>
                  <div className={styles.settingDescription} style={{ color: colors.textSecondary }}>
                    Allow collaborators with edit access to invite others
                  </div>
                </div>
                
                <div className={styles.settingControl}>
                  <label className={styles.switch}>
                    <input 
                      type="checkbox"
                      checked={canInvite && !isOwner && !isAdmin}
                      onChange={toggleCollaboratorsCanInvite}
                    />
                    <span 
                      className={styles.slider}
                      style={{ 
                        backgroundColor: canInvite && !isOwner && !isAdmin ? colors.primary : colors.border
                      }}
                    ></span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CollaboratorsPanel;