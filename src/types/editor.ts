// Define base types for the editor

export interface File {
  id: string;
  name: string;
  path: string;
  type: string;
  content?: string | null;
  children?: string[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  files: File[];
  createdAt: string;
  user_id: string;
  is_public: boolean;
}

export interface ProjectCollaborator {
  id: string;
  username: string;
  avatar_url: string;
  permission: 'read' | 'write' | 'admin';
}

export interface Tab {
  id: string;
  fileId: string;
  title: string;
  path: string;
  language: string;
}

export interface Breakpoint {
  line: number;
  fileId: string;
}

export enum FileTreeActionType {
  CREATE_FILE = 'CREATE_FILE',
  CREATE_DIRECTORY = 'CREATE_DIRECTORY',
  RENAME = 'RENAME',
  DELETE = 'DELETE',
  MOVE = 'MOVE'
}

export enum FileType {
  FILE = 'file',
  DIRECTORY = 'directory'
}

export interface FileOperation {
  type: FileTreeActionType;
  fileId?: string;
  path?: string;
  name?: string;
  fileType?: FileType;
  targetPath?: string;
  content?: string;
}

export type FileTab = {
  id: string;
  name: string;
  path: string;
  language: string;
  content: string;
};

export type SearchMatch = {
  lineNumber: number;
  lineContent: string;
  matchStartIndex: number;
  matchEndIndex: number;
  matchText: string;
};

export type FileSearchResult = {
  fileId: string;
  fileName: string;
  filePath: string;
  matches: SearchMatch[];
};