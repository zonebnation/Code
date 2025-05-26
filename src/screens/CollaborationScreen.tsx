import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { 
  User, 
  UserPlus, 
  Users, 
  Inbox, 
  Check, 
  X, 
  Plus,
  ChevronLeft,
  Share2 
} from 'lucide-react';
import EmptyState from '../components/shared/EmptyState';
import InvitationsList from '../components/Collaboration/InvitationsList';
import CollaboratorsPanel from '../components/Collaboration/CollaboratorsPanel';
import styles from './CollaborationScreen.module.css';
import { supabase } from '../lib/supabase-init';
import { useNavigate } from 'react-router-dom';
import ShareModal from '../components/Sharing/ShareModal';

const CollaborationScreen = () => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { currentProject, projects, selectProject } = useProject();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'invitations' | 'collaborators'>('invitations');
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [sharedProjects, setSharedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  // Fetch invitations and shared projects
  useEffect(() => {
    if (user) {
      fetchPendingInvitations();
      fetchSharedProjects();
    }
  }, [user]);
  
  // Fetch pending invitations
  const fetchPendingInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('collaboration_invites')
        .select(`
          id,
          project_id,
          permission,
          created_at,
          projects:project_id (name),
          profiles:inviter_id (id, username, avatar_url)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      // Format invitations
      const formattedInvitations = data.map((invite: any) => ({
        id: invite.id,
        projectId: invite.project_id,
        projectName: invite.projects.name,
        inviterId: invite.profiles.id,
        inviterName: invite.profiles.username,
        permission: invite.permission,
        createdAt: invite.created_at
      }));
      
      setPendingInvitations(formattedInvitations);
    } catch (error: any) {
      console.error('Error fetching invitations:', error);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch projects shared with current user
  const fetchSharedProjects = async () => {
    if (!user) return;
    
    try {
      // Get projects where user is a collaborator
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          permission,
          project:project_id (
            id,
            name,
            is_public,
            created_at,
            profiles:user_id (id, username)
          )
        `)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Format shared projects
      const formattedProjects = data.map((item: any) => ({
        id: item.project.id,
        name: item.project.name,
        isPublic: item.project.is_public,
        createdAt: item.project.created_at,
        permission: item.permission,
        ownerId: item.project.profiles.id,
        ownerName: item.project.profiles.username
      }));
      
      setSharedProjects(formattedProjects);
    } catch (error: any) {
      console.error('Error fetching shared projects:', error);
      setError('Failed to load shared projects');
    }
  };
  
  // Accept an invitation
  const handleAcceptInvitation = async (invitationId: string) => {
    if (!user) return;
    
    try {
      // Update the invitation status
      const { error } = await supabase
        .from('collaboration_invites')
        .update({ status: 'accepted' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Refresh data
      fetchPendingInvitations();
      fetchSharedProjects();
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      alert('Failed to accept invitation');
    }
  };
  
  // Reject an invitation
  const handleRejectInvitation = async (invitationId: string) => {
    if (!user) return;
    
    try {
      // Update the invitation status
      const { error } = await supabase
        .from('collaboration_invites')
        .update({ status: 'rejected' })
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Refresh data
      fetchPendingInvitations();
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      alert('Failed to reject invitation');
    }
  };
  
  // Open a shared project
  const handleOpenProject = (projectId: string) => {
    // Find the project in projects
    const project = projects.find(p => p.id === projectId);
    if (project) {
      selectProject(projectId);
      navigate('/editor');
    } else {
      // Project not loaded yet, first fetch it
      alert('Loading project...');
      // In a real implementation, you would fetch the project here
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get badge color based on permission
  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin':
        return colors.warning;
      case 'write':
        return colors.primary;
      case 'read':
      default:
        return colors.textSecondary;
    }
  };
  
  // Get permission label
  const getPermissionLabel = (permission: string) => {
    switch (permission) {
      case 'admin':
        return 'Admin';
      case 'write':
        return 'Editor';
      case 'read':
      default:
        return 'Viewer';
    }
  };
  
  if (!user) {
    return (
      <EmptyState
        icon="Users"
        title="Sign In Required"
        message="Please sign in to view your collaboration invitations and shared projects."
        actionText="Sign In"
        actionPath="/auth"
      />
    );
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
        <div className={styles.titleSection}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            <ChevronLeft size={20} color={colors.primary} />
          </button>
          <h1 style={{ color: colors.text }}>Collaboration</h1>
          
          {/* Share Button - New addition */}
          {currentProject && (
            <button 
              className={styles.shareButton}
              onClick={() => setIsShareModalOpen(true)}
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
              <Share2 size={18} color="white" />
              <span>Share Project</span>
            </button>
          )}
        </div>
        
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 'invitations' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('invitations')}
            style={{ 
              color: activeTab === 'invitations' ? colors.primary : colors.textSecondary,
              borderBottomColor: activeTab === 'invitations' ? colors.primary : 'transparent'
            }}
          >
            <Inbox size={16} />
            <span>Invitations</span>
            {pendingInvitations.length > 0 && (
              <div 
                className={styles.badge}
                style={{ backgroundColor: colors.primary }}
              >
                {pendingInvitations.length}
              </div>
            )}
          </button>
          
          <button 
            className={`${styles.tab} ${activeTab === 'collaborators' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('collaborators')}
            style={{ 
              color: activeTab === 'collaborators' ? colors.primary : colors.textSecondary,
              borderBottomColor: activeTab === 'collaborators' ? colors.primary : 'transparent'
            }}
          >
            <Users size={16} />
            <span>Shared Projects</span>
          </button>
        </div>
      </div>
      
      <div className={styles.content}>
        {activeTab === 'invitations' && (
          <div className={styles.invitationsTab}>
            {loading ? (
              <div className={styles.loading}>
                Loading invitations...
              </div>
            ) : pendingInvitations.length === 0 ? (
              <div className={styles.emptyState}>
                <Inbox size={40} color={colors.textSecondary} />
                <p>No pending invitations</p>
                <p className={styles.emptyStateSubtext}>
                  When someone invites you to collaborate, you'll see it here
                </p>
              </div>
            ) : (
              <div className={styles.invitationList}>
                {pendingInvitations.map(invitation => (
                  <div 
                    key={invitation.id}
                    className={styles.invitationCard}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }}
                  >
                    <div className={styles.invitationHeader}>
                      <h3 style={{ color: colors.text }}>{invitation.projectName}</h3>
                      <div 
                        className={styles.invitationDate}
                        style={{ color: colors.textSecondary }}
                      >
                        {formatDate(invitation.createdAt)}
                      </div>
                    </div>
                    
                    <div className={styles.invitationBody}>
                      <div className={styles.invitationInfo}>
                        <div 
                          className={styles.inviterAvatar}
                          style={{ backgroundColor: `${colors.primary}20` }}
                        >
                          <User size={16} color={colors.primary} />
                        </div>
                        <p style={{ color: colors.text }}>
                          <strong>{invitation.inviterName || 'A user'}</strong> invited you to collaborate
                        </p>
                      </div>
                      
                      <div 
                        className={styles.permissionBadge}
                        style={{ 
                          backgroundColor: `${getPermissionColor(invitation.permission)}20`,
                          color: getPermissionColor(invitation.permission)
                        }}
                      >
                        {getPermissionLabel(invitation.permission)}
                      </div>
                    </div>
                    
                    <div className={styles.invitationActions}>
                      <button 
                        className={styles.rejectButton}
                        onClick={() => handleRejectInvitation(invitation.id)}
                        style={{ borderColor: colors.error, color: colors.error }}
                      >
                        <X size={16} />
                        <span>Decline</span>
                      </button>
                      
                      <button 
                        className={styles.acceptButton}
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Check size={16} color="#FFFFFF" />
                        <span>Accept</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'collaborators' && (
          <div className={styles.collaboratorsTab}>
            {loading ? (
              <div className={styles.loading}>
                Loading shared projects...
              </div>
            ) : sharedProjects.length === 0 ? (
              <div className={styles.emptyState}>
                <Users size={40} color={colors.textSecondary} />
                <p>No shared projects</p>
                <p className={styles.emptyStateSubtext}>
                  You aren't collaborating on any projects yet
                </p>
              </div>
            ) : (
              <div className={styles.sharedProjectsList}>
                {sharedProjects.map(project => (
                  <div 
                    key={project.id}
                    className={styles.sharedProjectCard}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.border
                    }}
                    onClick={() => handleOpenProject(project.id)}
                  >
                    <div className={styles.projectHeader}>
                      <h3 style={{ color: colors.text }}>{project.name}</h3>
                      <div 
                        className={styles.permissionBadge}
                        style={{ 
                          backgroundColor: `${getPermissionColor(project.permission)}20`,
                          color: getPermissionColor(project.permission)
                        }}
                      >
                        {getPermissionLabel(project.permission)}
                      </div>
                    </div>
                    
                    <div className={styles.projectInfo}>
                      <div 
                        className={styles.ownerInfo}
                        style={{ color: colors.textSecondary }}
                      >
                        <User size={14} />
                        <span>Owner: {project.ownerName || 'Unknown'}</span>
                      </div>
                      
                      <div 
                        className={styles.projectDate}
                        style={{ color: colors.textSecondary }}
                      >
                        Created: {formatDate(project.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className={styles.createProjectButton}>
              <button
                onClick={() => navigate('/explorer')}
                style={{ backgroundColor: colors.primary }}
              >
                <Plus size={16} color="#FFFFFF" />
                <span>Create New Shared Project</span>
              </button>
            </div>
          </div>
        )}
        
        {currentProject && activeTab === 'collaborators' && (
          <div className={styles.currentProjectCollaborators}>
            <h2 style={{ color: colors.text }}>Current Project Collaborators</h2>
            <CollaboratorsPanel />
          </div>
        )}
      </div>
      
      {/* Share Modal */}
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={currentProject}
      />
    </div>
  );
};

export default CollaborationScreen;