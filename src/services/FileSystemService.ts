import { Project, File } from '../types/editor';
import { detectLanguage } from '../utils/languageDetection';

export interface FileSystemItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  mtime?: string;
}

// Mock implementation of FileSystemService for web
class FileSystemService {
  async checkPermissions(): Promise<boolean> {
    // Always return true in web environment
    return true;
  }

  async listDirectory(): Promise<FileSystemItem[]> {
    console.log("listDirectory is a mock in web version");
    // Return mock data
    return [
      { name: 'Documents', path: '/Documents', type: 'directory' },
      { name: 'Projects', path: '/Projects', type: 'directory' },
      { name: 'sample.js', path: '/sample.js', type: 'file' },
    ];
  }

  async readFile(): Promise<string> {
    console.log("readFile is a mock in web version");
    return '// Sample file content';
  }

  async writeFile(): Promise<void> {
    console.log("writeFile is a mock in web version");
    // No-op in web
  }

  async createDirectory(): Promise<void> {
    console.log("createDirectory is a mock in web version");
    // No-op in web
  }

  async deleteFile(): Promise<void> {
    console.log("deleteFile is a mock in web version");
    // No-op in web
  }

  async deleteDirectory(): Promise<void> {
    console.log("deleteDirectory is a mock in web version");
    // No-op in web
  }

  async renameFile(): Promise<void> {
    console.log("renameFile is a mock in web version");
    // No-op in web
  }

  // Create a sample project structure
  async convertFolderToProject(folderPath: string): Promise<Project> {
    console.log("convertFolderToProject is a mock in web version");
    
    const folderName = folderPath.split('/').filter(Boolean).pop() || 'New Project';
    
    // Create a simple project structure
    const project: Project = {
      id: `project-${Date.now()}`,
      name: folderName,
      path: folderPath,
      files: [
        {
          id: 'file-1',
          name: 'index.js',
          type: 'file',
          path: '/index.js',
          content: '// Auto-generated file\nconsole.log("Hello, world!");',
        },
        {
          id: 'folder-1',
          name: 'src',
          type: 'directory',
          path: '/src',
          children: ['file-2'],
        },
        {
          id: 'file-2',
          name: 'app.js',
          type: 'file',
          path: '/src/app.js',
          content: '// App logic goes here\nconsole.log("App initialized");',
        }
      ],
      createdAt: new Date().toISOString()
    };
    
    return project;
  }

  private isTextFile(filename: string): boolean {
    const textExtensions = [
      'txt', 'md', 'markdown', 'html', 'htm', 'css', 'scss', 'less',
      'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'yaml', 'yml', 'ini',
      'cfg', 'conf', 'py', 'rb', 'java', 'c', 'cpp', 'h', 'cs', 'php',
      'go', 'rs', 'swift', 'kt', 'sh', 'bat', 'ps1', 'sql', 'graphql'
    ];
    
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? textExtensions.includes(extension) : false;
  }
}

export default new FileSystemService();