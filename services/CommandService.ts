export type Command = {
  id: string;
  title: string;
  category: string;
  shortcut?: string;
  action: () => void;
};

class CommandService {
  private commands: Map<string, Command> = new Map();
  
  registerCommand(command: Command) {
    this.commands.set(command.id, command);
  }
  
  registerCommands(commands: Command[]) {
    commands.forEach(command => this.registerCommand(command));
  }
  
  getCommand(id: string): Command | undefined {
    return this.commands.get(id);
  }
  
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
  
  executeCommand(id: string): boolean {
    const command = this.commands.get(id);
    if (command) {
      command.action();
      return true;
    }
    return false;
  }
  
  searchCommands(query: string): Command[] {
    if (!query) {
      return this.getAllCommands();
    }
    
    const lowerQuery = query.toLowerCase();
    return this.getAllCommands().filter(command => {
      // Check if query matches command title or category
      return (
        command.title.toLowerCase().includes(lowerQuery) ||
        command.category.toLowerCase().includes(lowerQuery)
      );
    });
  }
}

export default new CommandService();