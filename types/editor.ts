export type File = {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  content?: string;
  children?: string[];
};

export type Project = {
  id: string;
  name: string;
  path: string;
  files: File[];
  createdAt: string;
  filesystemDirectory?: string;
  user_id: string;
  is_public: boolean;
  isPublic?: boolean;
  isExternal?: boolean;
  description?: string;
  collaborators?: {
    id: string;
    username: string;
    permission: 'read' | 'write' | 'admin';
  }[];
};

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

export type Breakpoint = {
  line: number;
  fileId: string;
};

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