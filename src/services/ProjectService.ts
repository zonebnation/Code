import { supabase } from './supabase';
import { Project, File } from '../types/editor';

interface SyncProjectResponse {
  project: {
    id: string;
    name: string;
    description: string;
    user_id: string;
    is_public: boolean;
    created_at: string;
    updated_at: string;
    files: Array<{
      id: string;
      project_id: string;
      name: string;
      path: string;
      content: string | null;
      type: string;
      parent_id: string | null;
      created_at: string;
      updated_at: string;
    }>;
  };
  message: string;
}

class ProjectService {
  /**
   * Fetches all projects for the current user
   */
  async getUserProjects(): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return data.map(this.mapDatabaseProjectToModel);
  }

  /**
   * Fetches a specific project by ID
   */
  async getProjectById(id: string): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        files:project_files(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    
    return this.mapDatabaseProjectToModel(data);
  }

  /**
   * Syncs a local project with the server
   */
  async syncProject(project: Project): Promise<Project> {
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-project`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          project: {
            id: project.id,
            name: project.name,
            description: project.description || '',
            is_public: project.is_public || false,
          },
          files: project.files.map(file => ({
            id: file.id,
            name: file.name,
            path: file.path,
            content: file.content || '',
            type: file.type,
            parent_id: this.getParentIdFromProject(file, project),
          })),
        }),
      });

      const result: SyncProjectResponse = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to sync project');
      }
      
      return this.mapDatabaseProjectToModel(result.project);
    } catch (error) {
      console.error('Error syncing project:', error);
      throw error;
    }
  }

  /**
   * Creates a new project
   */
  async createProject(name: string, isPublic: boolean = false): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name,
        is_public: isPublic,
      })
      .select()
      .single();

    if (error) throw error;

    return this.mapDatabaseProjectToModel(data);
  }

  /**
   * Updates a project's metadata
   */
  async updateProject(id: string, updates: { name?: string; description?: string; is_public?: boolean }): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Deletes a project
   */
  async deleteProject(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Adds a collaborator to a project
   */
  async addCollaborator(projectId: string, userId: string, permission: 'read' | 'write' | 'admin'): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .insert({
        project_id: projectId,
        user_id: userId,
        permission,
      });

    if (error) throw error;
  }

  /**
   * Removes a collaborator from a project
   */
  async removeCollaborator(projectId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('project_collaborators')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  /**
   * Gets all collaborators for a project
   */
  async getProjectCollaborators(projectId: string): Promise<Array<{ id: string; username: string; avatar_url: string; permission: string; }>> {
    const { data, error } = await supabase
      .from('project_collaborators')
      .select(`
        id,
        permission,
        profiles:user_id (id, username, avatar_url)
      `)
      .eq('project_id', projectId);

    if (error) throw error;

    return data.map((collab: any) => ({
      id: collab.profiles.id,
      username: collab.profiles.username,
      avatar_url: collab.profiles.avatar_url,
      permission: collab.permission,
    }));
  }

  /**
   * Sends an invitation to collaborate on a project
   */
  async inviteCollaborator(projectId: string, email: string, permission: 'read' | 'write' | 'admin'): Promise<void> {
    // First, get the user ID from the email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) {
      throw new Error('User not found with that email');
    }

    const { error } = await supabase
      .from('collaboration_invites')
      .insert({
        project_id: projectId,
        invitee_id: userData.id,
        inviter_id: (await supabase.auth.getUser()).data.user?.id,
        permission,
      });

    if (error) throw error;
  }

  /**
   * Responds to a collaboration invitation
   */
  async respondToInvitation(inviteId: string, accept: boolean): Promise<void> {
    const status = accept ? 'accepted' : 'rejected';

    const { error } = await supabase
      .from('collaboration_invites')
      .update({ status })
      .eq('id', inviteId);

    if (error) throw error;
  }

  /**
   * Gets all pending invitations for the current user
   */
  async getPendingInvitations(): Promise<Array<{
    id: string;
    project_id: string;
    project_name: string;
    inviter_name: string | null;
    permission: string;
    created_at: string;
  }>> {
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
      .eq('status', 'pending');

    if (error) throw error;

    return data.map((invite: any) => ({
      id: invite.id,
      project_id: invite.project_id,
      project_name: invite.projects.name,
      inviter_name: invite.profiles.username,
      permission: invite.permission,
      created_at: invite.created_at,
    }));
  }

  /**
   * Maps a database project to our application model
   */
  private mapDatabaseProjectToModel(dbProject: any): Project {
    let files: File[] = [];
    
    if (dbProject.files) {
      files = dbProject.files.map((file: any) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        path: file.path,
        content: file.content,
        children: this.getChildrenIds(file.id, dbProject.files),
      }));
    }
    
    return {
      id: dbProject.id,
      name: dbProject.name,
      description: dbProject.description,
      path: `/projects/${dbProject.id}`,
      files: files,
      createdAt: dbProject.created_at,
      user_id: dbProject.user_id,
      is_public: dbProject.is_public,
    };
  }
  
  /**
   * Find children of a directory
   */
  private getChildrenIds(parentId: string, files: any[]): string[] {
    return files
      .filter(file => file.parent_id === parentId)
      .map(file => file.id);
  }
  
  /**
   * Get parent ID of a file from the project structure
   */
  private getParentIdFromProject(file: File, project: Project): string | null {
    if (!file.path || file.path === '/') return null;
    
    // Extract parent path
    const pathParts = file.path.split('/');
    pathParts.pop(); // Remove filename
    
    const parentPath = pathParts.join('/') || '/';
    
    // Find parent file by path
    const parentFile = project.files.find(f => f.path === parentPath);
    return parentFile?.id || null;
  }
}

export default new ProjectService();