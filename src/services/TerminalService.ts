export type CommandResult = {
  content: string;
  isError?: boolean;
  isHtml?: boolean;
};

export type CommandHandler = (args: string[], context: TerminalContext) => Promise<CommandResult>;

export type Command = {
  name: string;
  description: string;
  usage: string;
  handler: CommandHandler;
};

export type TerminalContext = {
  currentProject: any | null;
  currentDirectory: string;
  findFile: (path: string) => any | null;
  executeFile: (fileId: string) => Promise<string>;
  createFile: (name: string, parentPath: string) => Promise<void>;
  createDirectory: (name: string, parentPath: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  saveFile: (path: string, content: string) => Promise<void>;
};

class TerminalService {
  private commands: Map<string, Command> = new Map();
  
  constructor() {
    this.registerCommands();
  }
  
  registerCommands() {
    // Help command
    this.registerCommand({
      name: 'help',
      description: 'Display available commands',
      usage: 'help [command]',
      handler: async (args, context) => {
        if (args.length > 0) {
          const command = this.commands.get(args[0]);
          if (command) {
            return {
              content: `
                <div class="help-command">
                  <div class="help-name">${command.name}</div>
                  <div class="help-desc">${command.description}</div>
                  <div class="help-usage">Usage: ${command.usage}</div>
                </div>
              `,
              isHtml: true
            };
          } else {
            return { content: `Command not found: ${args[0]}`, isError: true };
          }
        }
        
        let content = '<div class="help-list">';
        this.commands.forEach(cmd => {
          content += `<div class="help-item"><span class="help-cmd">${cmd.name}</span> - ${cmd.description}</div>`;
        });
        content += '</div>';
        
        return { content, isHtml: true };
      }
    });
    
    // Clear command
    this.registerCommand({
      name: 'clear',
      description: 'Clear the terminal',
      usage: 'clear',
      handler: async () => ({ content: '$$CLEAR$$' })
    });
    
    // List directory command
    this.registerCommand({
      name: 'ls',
      description: 'List directory contents',
      usage: 'ls [path]',
      handler: async (args, context) => {
        if (!context.currentProject) {
          return { content: 'No project opened', isError: true };
        }
        
        const path = args.length > 0 ? args[0] : context.currentDirectory;
        const normalizedPath = this.normalizePath(path, context.currentDirectory);
        
        // Find all files in the current directory
        const files = context.currentProject.files.filter(file => {
          const parentPath = file.path.substring(0, file.path.lastIndexOf('/'));
          return parentPath === normalizedPath || (normalizedPath === '/' && parentPath === '');
        });
        
        if (files.length === 0) {
          return { content: 'Directory is empty' };
        }
        
        let content = '<div class="file-list">';
        const directories = files.filter(f => f.type === 'directory');
        const regularFiles = files.filter(f => f.type === 'file');
        
        // Sort and display directories first, then files
        directories.sort((a, b) => a.name.localeCompare(b.name));
        regularFiles.sort((a, b) => a.name.localeCompare(b.name));
        
        directories.forEach(dir => {
          content += `<div class="file-item directory">${dir.name}/</div>`;
        });
        
        regularFiles.forEach(file => {
          content += `<div class="file-item file">${file.name}</div>`;
        });
        
        content += '</div>';
        return { content, isHtml: true };
      }
    });
    
    // Print working directory command
    this.registerCommand({
      name: 'pwd',
      description: 'Print working directory',
      usage: 'pwd',
      handler: async (args, context) => {
        if (!context.currentProject) {
          return { content: 'No project opened', isError: true };
        }
        return { content: context.currentDirectory };
      }
    });
    
    // Change directory command
    this.registerCommand({
      name: 'cd',
      description: 'Change directory',
      usage: 'cd <path>',
      handler: async (args, context) => {
        if (!context.currentProject) {
          return { content: 'No project opened', isError: true };
        }
        
        if (args.length === 0) {
          return { content: context.currentDirectory };
        }
        
        const path = args[0];
        
        // Special case for '..'
        if (path === '..') {
          if (context.currentDirectory === '/') {
            return { content: '/' }; // Already at root
          }
          
          const parts = context.currentDirectory.split('/').filter(Boolean);
          parts.pop(); // Remove last part
          const newPath = parts.length > 0 ? '/' + parts.join('/') : '/';
          return { content: `$$CD$$${newPath}` };
        }
        
        const normalizedPath = this.normalizePath(path, context.currentDirectory);
        
        // Check if the path exists and is a directory
        const directory = context.currentProject.files.find(
          file => file.path === normalizedPath && file.type === 'directory'
        );
        
        if (!directory) {
          return { content: `Directory not found: ${normalizedPath}`, isError: true };
        }
        
        return { content: `$$CD$$${normalizedPath}` };
      }
    });
    
    // Cat command
    this.registerCommand({
      name: 'cat',
      description: 'Display file contents',
      usage: 'cat <file>',
      handler: async (args, context) => {
        if (!context.currentProject) {
          return { content: 'No project opened', isError: true };
        }
        
        if (args.length === 0) {
          return { content: 'Usage: cat <file>', isError: true };
        }
        
        const path = args[0];
        const normalizedPath = this.normalizePath(path, context.currentDirectory);
        
        const file = context.findFile(normalizedPath);
        if (!file || file.type !== 'file') {
          return { content: `File not found: ${normalizedPath}`, isError: true };
        }
        
        return { content: file.content || '(empty file)' };
      }
    });
    
    // Add more basic commands as needed
  }
  
  registerCommand(command: Command) {
    this.commands.set(command.name, command);
  }
  
  async executeCommand(commandLine: string, context: TerminalContext): Promise<CommandResult> {
    const args = this.parseCommandLine(commandLine);
    if (args.length === 0) {
      return { content: '' };
    }
    
    const commandName = args[0];
    const command = this.commands.get(commandName);
    
    if (!command) {
      return { content: `Command not found: ${commandName}`, isError: true };
    }
    
    try {
      return await command.handler(args.slice(1), context);
    } catch (error) {
      return { content: `Error executing command: ${error}`, isError: true };
    }
  }
  
  parseCommandLine(commandLine: string): string[] {
    const args: string[] = [];
    let currentArg = '';
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < commandLine.length; i++) {
      const char = commandLine[i];
      
      if (escapeNext) {
        currentArg += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
        continue;
      }
      
      if (char === ' ' && !inQuotes) {
        if (currentArg) {
          args.push(currentArg);
          currentArg = '';
        }
        continue;
      }
      
      currentArg += char;
    }
    
    if (currentArg) {
      args.push(currentArg);
    }
    
    return args;
  }
  
  normalizePath(path: string, currentDirectory: string): string {
    // Handle absolute paths
    if (path.startsWith('/')) {
      return path;
    }
    
    // Handle relative paths
    if (currentDirectory === '/') {
      return `/${path}`;
    } else {
      return `${currentDirectory}/${path}`;
    }
  }
}

export default new TerminalService();