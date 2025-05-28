import { supabase } from './supabase';
import { PresenceData, CollaborationState, CursorData, EditOperation } from '../types/collaboration';
import { Project } from '../types/editor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { v4 as uuidv4 } from 'uuid';
import { RealtimeChannel } from '@supabase/supabase-js';

// Generate a consistent color for a user
const getUserColor = (userId: string): string => {
  // List of distinct, accessible colors
  const colors = [
    '#FF5733', // Red
    '#33FF57', // Green
    '#3357FF', // Blue
    '#FF33F5', // Pink
    '#33FFF5', // Cyan
    '#F5FF33', // Yellow
    '#FF8333', // Orange
    '#8333FF', // Purple
    '#33FFAA', // Mint
    '#FF33AA', // Rose
  ];
  
  // Generate a consistent index based on userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  
  // Ensure positive index
  hash = Math.abs(hash);
  
  // Get color from the array
  return colors[hash % colors.length];
};

class CollaborationService {
  private presenceChannels: Map<string, RealtimeChannel> = new Map();
  private changeChannels: Map<string, RealtimeChannel> = new Map();
  private collaborators: Map<string, PresenceData[]> = new Map();
  private cursors: Map<string, Map<string, CursorData>> = new Map();
  private onCollaboratorsChange: Map<string, (collaborators: PresenceData[]) => void> = new Map();
  private onContentChange: Map<string, (fileId: string, content: string, user: PresenceData) => void> = new Map();
  private onCursorsChange: Map<string, (cursors: CursorData[]) => void> = new Map();
  
  // YJS document and providers
  private ydocs: Map<string, Y.Doc> = new Map();
  private providers: Map<string, WebsocketProvider> = new Map();
  private bindings: Map<string, MonacoBinding> = new Map();
  
  // Join a collaboration session for a project
  async joinProject(
    projectId: string, 
    userId: string, 
    username: string, 
    avatarUrl: string | null,
    onCollaboratorsChange: (collaborators: PresenceData[]) => void
  ): Promise<void> {
    // Set up presence channel for this project
    const presenceChannel = supabase.channel(`presence-${projectId}`);
    
    // Set up presence
    await presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        // Track presence with user data
        await presenceChannel.track({
          user_id: userId,
          username: username,
          avatar_url: avatarUrl,
          online_at: new Date().toISOString(),
        });
      }
    });
    
    // Set up presence sync handler
    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const collaborators: PresenceData[] = [];
      
      Object.values(state).forEach((presences: any) => {
        presences.forEach((presence: any) => {
          collaborators.push({
            userId: presence.user_id,
            username: presence.username,
            avatarUrl: presence.avatar_url,
            currentFileId: presence.current_file,
            onlineAt: new Date(presence.online_at)
          });
        });
      });
      
      this.collaborators.set(projectId, collaborators);
      onCollaboratorsChange(collaborators);
    });
    
    // Store channel and callback
    this.presenceChannels.set(projectId, presenceChannel);
    this.onCollaboratorsChange.set(projectId, onCollaboratorsChange);
    
    console.log('Joined collaboration for project:', projectId);
  }
  
  // Update user's editing status
  async updateEditingFile(
    projectId: string, 
    userId: string, 
    fileId: string | null
  ): Promise<void> {
    const presenceChannel = this.presenceChannels.get(projectId);
    if (!presenceChannel) {
      console.warn('No presence channel for project:', projectId);
      return;
    }
    
    // Update presence with current file
    await presenceChannel.track({
      user_id: userId,
      current_file: fileId,
      online_at: new Date().toISOString()
    });
  }
  
  // Join a collaboration session for a specific file
  async joinFile(
    projectId: string,
    fileId: string,
    userId: string,
    username: string,
    avatarUrl: string | null,
    editor: any, // Monaco editor instance
    onContentChange: (fileId: string, content: string, user: PresenceData) => void,
    onCursorsChange: (cursors: CursorData[]) => void
  ): Promise<void> {
    // Initialize cursor map for this file if it doesn't exist
    const fileKey = `${projectId}-${fileId}`;
    if (!this.cursors.has(fileKey)) {
      this.cursors.set(fileKey, new Map());
    }
    
    // Set up YJS document for this file
    const ydoc = new Y.Doc();
    this.ydocs.set(fileKey, ydoc);
    
    // Create text type for the file content
    const ytext = ydoc.getText('monaco');
    
    // Set up WebSocket provider
    // In a real implementation, you would use your own WebSocket server
    // For this example, we'll use a public demo server
    const provider = new WebsocketProvider(
      'wss://demos.yjs.dev', 
      `code-canvas-${projectId}-${fileId}`, 
      ydoc
    );
    
    // Set user information in the provider
    provider.awareness.setLocalStateField('user', {
      id: userId,
      name: username,
      avatar: avatarUrl,
      color: getUserColor(userId)
    });
    
    this.providers.set(fileKey, provider);
    
    // Create binding between YJS and Monaco
    const binding = new MonacoBinding(
      ytext, 
      editor.getModel(), 
      new Set([editor]), 
      provider.awareness
    );
    
    this.bindings.set(fileKey, binding);
    
    // Set up awareness (cursor) handling
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates();
      const cursors: CursorData[] = [];
      
      states.forEach((state: any, clientId: number) => {
        if (state.user && state.cursor) {
          const cursor: CursorData = {
            userId: state.user.id,
            username: state.user.name,
            avatarUrl: state.user.avatar,
            color: state.user.color,
            line: state.cursor.head.line,
            column: state.cursor.head.character,
            selection: state.cursor.anchor ? {
              startLine: state.cursor.anchor.line,
              startColumn: state.cursor.anchor.character,
              endLine: state.cursor.head.line,
              endColumn: state.cursor.head.character
            } : undefined
          };
          
          // Update cursor map
          this.cursors.get(fileKey)?.set(state.user.id, cursor);
          
          // Only add to the list if it's not the current user
          if (state.user.id !== userId) {
            cursors.push(cursor);
          }
        }
      });
      
      // Notify about cursor changes
      onCursorsChange(cursors);
    });
    
    // Set up channel for file changes
    const channel = supabase.channel(`file-${projectId}-${fileId}`);
    
    // Subscribe to file changes
    await channel.subscribe((status) => {
      if (status !== 'SUBSCRIBED') {
        console.warn(`Failed to subscribe to file changes: ${status}`);
        return;
      }
      
      console.log(`Subscribed to changes for file ${fileId}`);
    });
    
    // Listen for file content changes
    channel.on('broadcast', { event: 'file_update' }, (payload) => {
      const { fileId, content, user } = payload.payload as {
        fileId: string;
        content: string;
        user: PresenceData;
      };
      
      // Ignore our own updates
      if (user.userId === userId) return;
      
      // Notify about content change
      onContentChange(fileId, content, user);
    });
    
    // Store channel and callbacks
    this.changeChannels.set(fileKey, channel);
    this.onContentChange.set(fileKey, onContentChange);
    this.onCursorsChange.set(fileKey, onCursorsChange);
    
    console.log('Joined file collaboration:', fileId);
  }
  
  // Update cursor position
  updateCursor(
    projectId: string,
    fileId: string,
    userId: string,
    position: { line: number; column: number },
    selection?: { startLine: number; startColumn: number; endLine: number; endColumn: number }
  ): void {
    const fileKey = `${projectId}-${fileId}`;
    const provider = this.providers.get(fileKey);
    
    if (!provider) {
      console.warn('No provider for file:', fileId);
      return;
    }
    
    // Update awareness state with cursor position
    provider.awareness.setLocalStateField('cursor', {
      head: { line: position.line, character: position.column },
      anchor: selection ? { line: selection.startLine, character: selection.startColumn } : undefined
    });
  }
  
  // Broadcast file content changes to other collaborators
  async broadcastFileChange(
    projectId: string,
    fileId: string,
    content: string,
    user: {
      userId: string;
      username: string;
      avatarUrl: string | null;
    }
  ): Promise<void> {
    const fileKey = `${projectId}-${fileId}`;
    const channel = this.changeChannels.get(fileKey);
    if (!channel) {
      console.warn('No channel for file:', fileId);
      return;
    }
    
    // Broadcast change to all subscribers
    await channel.send({
      type: 'broadcast',
      event: 'file_update',
      payload: {
        fileId,
        content,
        user
      }
    });
  }
  
  // Apply an edit operation to the document
  applyEditOperation(
    projectId: string,
    fileId: string,
    operation: EditOperation
  ): void {
    const fileKey = `${projectId}-${fileId}`;
    const ydoc = this.ydocs.get(fileKey);
    
    if (!ydoc) {
      console.warn('No YDoc for file:', fileId);
      return;
    }
    
    const ytext = ydoc.getText('monaco');
    
    // Apply the operation
    ydoc.transact(() => {
      switch (operation.type) {
        case 'insert':
          if (operation.text) {
            // Convert position to index in the document
            const index = this.positionToIndex(ytext.toString(), operation.position);
            ytext.insert(index, operation.text);
          }
          break;
        case 'delete':
          if (operation.length) {
            const index = this.positionToIndex(ytext.toString(), operation.position);
            ytext.delete(index, operation.length);
          }
          break;
        case 'replace':
          if (operation.text && operation.length) {
            const index = this.positionToIndex(ytext.toString(), operation.position);
            ytext.delete(index, operation.length);
            ytext.insert(index, operation.text);
          }
          break;
      }
    });
  }
  
  // Helper to convert line/column position to index
  private positionToIndex(text: string, position: { line: number; column: number }): number {
    const lines = text.split('\n');
    let index = 0;
    
    // Add length of all previous lines plus newline characters
    for (let i = 0; i < position.line; i++) {
      index += (lines[i]?.length || 0) + 1; // +1 for newline
    }
    
    // Add column position
    index += Math.min(position.column, lines[position.line]?.length || 0);
    
    return index;
  }
  
  // Leave a collaboration session for a file
  leaveFile(projectId: string, fileId: string): void {
    const fileKey = `${projectId}-${fileId}`;
    
    // Clean up YJS resources
    const provider = this.providers.get(fileKey);
    if (provider) {
      provider.destroy();
      this.providers.delete(fileKey);
    }
    
    const binding = this.bindings.get(fileKey);
    if (binding) {
      binding.destroy();
      this.bindings.delete(fileKey);
    }
    
    const ydoc = this.ydocs.get(fileKey);
    if (ydoc) {
      ydoc.destroy();
      this.ydocs.delete(fileKey);
    }
    
    // Clean up Supabase channels
    const channel = this.changeChannels.get(fileKey);
    if (channel) {
      channel.unsubscribe();
      this.changeChannels.delete(fileKey);
      this.onContentChange.delete(fileKey);
      this.onCursorsChange.delete(fileKey);
    }
    
    // Clean up cursors
    this.cursors.delete(fileKey);
    
    console.log('Left file collaboration:', fileId);
  }
  
  // Leave a project collaboration session
  leaveProject(projectId: string): void {
    const presenceChannel = this.presenceChannels.get(projectId);
    
    if (presenceChannel) {
      presenceChannel.untrack();
      presenceChannel.unsubscribe();
      this.presenceChannels.delete(projectId);
      this.onCollaboratorsChange.delete(projectId);
      this.collaborators.delete(projectId);
      console.log('Left project collaboration:', projectId);
    }
    
    // Also clean up any file channels for this project
    for (const [key, channel] of this.changeChannels.entries()) {
      if (key.startsWith(`${projectId}-`)) {
        channel.unsubscribe();
        this.changeChannels.delete(key);
        this.onContentChange.delete(key);
        this.onCursorsChange.delete(key);
      }
    }
    
    // Clean up YJS resources
    for (const [key, provider] of this.providers.entries()) {
      if (key.startsWith(`${projectId}-`)) {
        provider.destroy();
        this.providers.delete(key);
      }
    }
    
    for (const [key, binding] of this.bindings.entries()) {
      if (key.startsWith(`${projectId}-`)) {
        binding.destroy();
        this.bindings.delete(key);
      }
    }
    
    for (const [key, ydoc] of this.ydocs.entries()) {
      if (key.startsWith(`${projectId}-`)) {
        ydoc.destroy();
        this.ydocs.delete(key);
      }
    }
    
    // Clean up cursors
    for (const [key] of this.cursors.entries()) {
      if (key.startsWith(`${projectId}-`)) {
        this.cursors.delete(key);
      }
    }
  }
  
  // Get a list of currently active collaborators for a project
  getCollaborators(projectId: string): PresenceData[] {
    return this.collaborators.get(projectId) || [];
  }
  
  // Get cursors for a specific file
  getCursors(projectId: string, fileId: string): CursorData[] {
    const fileKey = `${projectId}-${fileId}`;
    const cursorMap = this.cursors.get(fileKey);
    
    if (!cursorMap) return [];
    
    return Array.from(cursorMap.values());
  }
  
  // Check if a project is shared/collaborative
  async isCollaborativeProject(projectId: string): Promise<boolean> {
    try {
      // Check for collaborators
      const { count, error } = await supabase
        .from('project_collaborators')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      // Since count is possibly null, we need to ensure it's treated as a number
      return count ? count > 0 : false;
    } catch (error) {
      console.error('Error checking if project is collaborative:', error);
      return false;
    }
  }
  
  // Get all collaborators for a project (including permission levels)
  async getProjectCollaborators(projectId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select(`
          id,
          permission,
          profiles:user_id (id, username, avatar_url)
        `)
        .eq('project_id', projectId);
      
      if (error) throw error;
      
      return data.map((item: any) => ({
        id: item.profiles.id,
        username: item.profiles.username,
        avatarUrl: item.profiles.avatar_url,
        permission: item.permission
      }));
    } catch (error) {
      console.error('Error fetching project collaborators:', error);
      return [];
    }
  }
  
  // Create a new shared project
  async createSharedProject(projectName: string): Promise<Project | null> {
    try {
      // Create a new project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName,
          is_public: true,
          collaborators_can_invite: true
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      
      // Return the new project
      return {
        id: projectData.id,
        name: projectData.name,
        path: `/projects/${projectData.name}`,
        files: [],
        createdAt: projectData.created_at,
        user_id: projectData.user_id,
        is_public: projectData.is_public
      };
    } catch (error) {
      console.error('Error creating shared project:', error);
      return null;
    }
  }
  
  // Get pending project invitations for current user
  async getPendingInvitations(): Promise<any[]> {
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
        .eq('status', 'pending');
      
      if (error) throw error;
      
      return data.map((invite: any) => ({
        id: invite.id,
        projectId: invite.project_id,
        projectName: invite.projects.name,
        inviterId: invite.profiles.id,
        inviterName: invite.profiles.username,
        inviterUsername: invite.profiles.username,
        inviterAvatar: invite.profiles.avatar_url,
        permission: invite.permission,
        createdAt: invite.created_at
      }));
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  }
}

export default new CollaborationService();