// Types for real-time collaboration features

// Data for users present in a collaborative session
export interface PresenceData {
  userId: string;
  username: string;
  avatarUrl: string | null;
  currentFileId?: string | null;
  onlineAt: Date;
}

// Cursor position and selection
export interface CursorData {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  color: string;
  line: number;
  column: number;
  selection?: {
    startLine: number;
    startColumn: number;
    endLine: number;
    endColumn: number;
  };
}

// The state of collaboration for a project
export interface CollaborationState {
  projectId: string;
  participants: PresenceData[];
  cursors: CursorData[];
}

// Types for chat messages
export interface ChatMessage {
  id: string;
  projectId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// Collaboration invitation
export interface CollaborationInvitation {
  id: string;
  projectId: string;
  inviterId: string;
  inviteeId: string;
  permission: 'read' | 'write' | 'admin';
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

// Operation for collaborative editing
export interface EditOperation {
  type: 'insert' | 'delete' | 'replace';
  position: {
    line: number;
    column: number;
  };
  text?: string;
  length?: number;
  userId: string;
  timestamp: number;
}