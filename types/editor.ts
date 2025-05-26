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