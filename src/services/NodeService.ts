import { CommandResult } from './TerminalService';

class NodeService {
  // Mock npm package registry for offline operation
  private npmRegistry: Record<string, string> = {
    'react': '18.2.0',
    'react-dom': '18.2.0',
    'express': '4.18.2',
    'typescript': '5.1.6',
    'tailwindcss': '3.3.3',
    'axios': '1.4.0',
    'lodash': '4.17.21',
    'next': '13.4.12',
    'vue': '3.3.4',
    'svelte': '4.0.5',
    'webpack': '5.88.2',
    'vite': '4.4.7',
    'jest': '29.6.1',
    'eslint': '8.45.0',
    'prettier': '3.0.0',
    'node-sass': '9.0.0',
    'styled-components': '6.0.5',
    'redux': '4.2.1',
    'mobx': '6.10.0',
    'mongoose': '7.4.1',
    'sequelize': '6.32.1',
    'prisma': '5.0.0',
    'socket.io': '4.7.1',
    'nodemon': '3.0.1',
    'cors': '2.8.5',
    'dotenv': '16.3.1',
    'bcrypt': '5.1.0',
    'jsonwebtoken': '9.0.1'
  };

  // Mock installed packages for the current project
  private installedPackages: Map<string, Map<string, string>> = new Map();

  // Execute npm command
  async executeNpm(args: string[], projectId: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { content: 'npm <command>\n\nUsage:\n  npm install [package]\n  npm init\n  npm list\n  npm run <script>' };
    }

    const command = args[0];

    switch (command) {
      case 'install':
      case 'i':
        return this.handleInstall(args.slice(1), projectId);
      case 'init':
        return this.handleInit(projectId);
      case 'list':
      case 'ls':
        return this.handleList(projectId);
      case 'run':
        return this.handleRun(args.slice(1), projectId);
      case 'uninstall':
      case 'remove':
        return this.handleUninstall(args.slice(1), projectId);
      default:
        return { content: `Unknown npm command: ${command}`, isError: true };
    }
  }

  // Handle npm install
  private async handleInstall(packages: string[], projectId: string): Promise<CommandResult> {
    if (!this.installedPackages.has(projectId)) {
      this.installedPackages.set(projectId, new Map());
    }

    const projectPackages = this.installedPackages.get(projectId)!;
    
    if (packages.length === 0) {
      return { content: 'Installing dependencies from package.json...\n\nAdded 150 packages in 2.5s\n\n✓ Packages installed successfully.' };
    }

    const results: string[] = [];
    let hasErrors = false;

    for (const pkg of packages) {
      // Parse package name and version
      let packageName = pkg;
      let packageVersion = 'latest';

      if (pkg.includes('@') && !pkg.startsWith('@')) {
        [packageName, packageVersion] = pkg.split('@');
      }

      if (packageVersion === 'latest') {
        packageVersion = this.npmRegistry[packageName] || '1.0.0';
      }

      if (this.npmRegistry[packageName]) {
        projectPackages.set(packageName, packageVersion);
        results.push(`+ ${packageName}@${packageVersion}`);
      } else {
        results.push(`Error: package '${packageName}' not found in registry`);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return { 
        content: `Installing packages...\n\n${results.join('\n')}\n\n⚠ Some packages failed to install.`, 
        isError: true 
      };
    }

    return { 
      content: `Installing packages...\n\n${results.join('\n')}\n\nAdded ${packages.length} package(s) in 1.2s\n\n✓ Packages installed successfully.` 
    };
  }

  // Handle npm init
  private async handleInit(projectId: string): Promise<CommandResult> {
    // Create a basic package.json structure
    return {
      content: `Creating a new package.json file...\n
{
  "name": "project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \\"Error: no test specified\\" && exit 1",
    "start": "node index.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}

✓ package.json created successfully.`
    };
  }

  // Handle npm list
  private async handleList(projectId: string): Promise<CommandResult> {
    if (!this.installedPackages.has(projectId)) {
      return { content: 'project@1.0.0\n└── (empty)' };
    }

    const projectPackages = this.installedPackages.get(projectId)!;
    
    if (projectPackages.size === 0) {
      return { content: 'project@1.0.0\n└── (empty)' };
    }

    const packageList = Array.from(projectPackages.entries())
      .map(([name, version]) => `└── ${name}@${version}`)
      .join('\n');

    return { content: `project@1.0.0\n${packageList}` };
  }

  // Handle npm run
  private async handleRun(args: string[], projectId: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { content: 'npm run <script>\n\nAvailable scripts: start, test, build, dev', isError: true };
    }

    const script = args[0];

    switch (script) {
      case 'start':
        return { content: '> project@1.0.0 start\n> node index.js\n\nServer running on port 3000' };
      case 'test':
        return { content: '> project@1.0.0 test\n> jest\n\nPASS  ./test.js\n✓ Sample test (2ms)\n\nTest Suites: 1 passed, 1 total\nTests:       1 passed, 1 total' };
      case 'build':
        return { content: '> project@1.0.0 build\n> webpack\n\nassets by status 1.21 MiB [cached] 1 asset\n\nwebpack 5.88.2 compiled successfully in 1243 ms' };
      case 'dev':
        return { content: '> project@1.0.0 dev\n> nodemon index.js\n\n[nodemon] 3.0.1\n[nodemon] starting `node index.js`\nServer running on port 3000\n[nodemon] watching path(s): *.*\n[nodemon] watching extensions: js,mjs,cjs,json' };
      default:
        return { content: `Unknown script: ${script}`, isError: true };
    }
  }

  // Handle npm uninstall
  private async handleUninstall(packages: string[], projectId: string): Promise<CommandResult> {
    if (!this.installedPackages.has(projectId)) {
      return { content: 'No packages installed.', isError: true };
    }

    const projectPackages = this.installedPackages.get(projectId)!;
    
    if (packages.length === 0) {
      return { content: 'npm uninstall <package>\n\nPlease specify a package to uninstall.', isError: true };
    }

    const results: string[] = [];
    let hasErrors = false;

    for (const pkg of packages) {
      if (projectPackages.has(pkg)) {
        projectPackages.delete(pkg);
        results.push(`- ${pkg}`);
      } else {
        results.push(`Error: package '${pkg}' is not installed`);
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return { 
        content: `Uninstalling packages...\n\n${results.join('\n')}\n\n⚠ Some packages failed to uninstall.`, 
        isError: true 
      };
    }

    return { 
      content: `Uninstalling packages...\n\n${results.join('\n')}\n\nRemoved ${packages.length} package(s) in 0.8s\n\n✓ Packages uninstalled successfully.` 
    };
  }

  // Execute Node.js script
  async executeNode(args: string[], projectId: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { 
        content: `Usage: node [options] [script.js] [arguments]

Options:
  -v, --version         print Node.js version
  -e, --eval string     evaluate string as JavaScript
  -p, --print string    evaluate and print result
  --help                print node command line options`,
      };
    }

    // Handle -v or --version flag
    if (args[0] === '-v' || args[0] === '--version') {
      return { content: 'v18.16.1' };
    }

    // Handle -e or --eval flag
    if (args[0] === '-e' || args[0] === '--eval') {
      if (args.length < 2) {
        return { content: 'Error: missing script for evaluation', isError: true };
      }
      return this.evaluateScript(args[1]);
    }

    // Handle -p or --print flag
    if (args[0] === '-p' || args[0] === '--print') {
      if (args.length < 2) {
        return { content: 'Error: missing script for evaluation', isError: true };
      }
      const result = await this.evaluateScript(args[1]);
      if (!result.isError) {
        result.content = `${result.content}\n${args[1]}`;
      }
      return result;
    }

    // Assume first arg is a script file
    return { content: 'Executing script file (simulated output)...\n\nHello from Node.js!\nProcess completed with exit code 0' };
  }

  // Evaluate JavaScript string
  private async evaluateScript(script: string): Promise<CommandResult> {
    try {
      // Simple evaluation - in a real implementation, this would use a safer sandboxed environment
      const result = eval(script);
      return { content: String(result) };
    } catch (error) {
      return { content: `Error: ${error}`, isError: true };
    }
  }

  // Execute yarn command (basic implementation)
  async executeYarn(args: string[], projectId: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { content: 'yarn <command>\n\nUsage:\n  yarn add [package]\n  yarn init\n  yarn list\n  yarn [script]' };
    }

    const command = args[0];

    switch (command) {
      case 'add':
        return this.handleInstall(args.slice(1), projectId);
      case 'init':
        return this.handleInit(projectId);
      case 'list':
      case 'ls':
        return this.handleList(projectId);
      case 'remove':
        return this.handleUninstall(args.slice(1), projectId);
      default:
        // Assume it's a script name
        if (command === 'start' || command === 'test' || command === 'build' || command === 'dev') {
          return this.handleRun([command], projectId);
        }
        return { content: `Unknown yarn command: ${command}`, isError: true };
    }
  }

  // Execute pnpm command (basic implementation)
  async executePnpm(args: string[], projectId: string): Promise<CommandResult> {
    if (args.length === 0) {
      return { content: 'pnpm <command>\n\nUsage:\n  pnpm add [package]\n  pnpm init\n  pnpm list\n  pnpm [script]' };
    }

    const command = args[0];

    switch (command) {
      case 'add':
        return this.handleInstall(args.slice(1), projectId);
      case 'init':
        return this.handleInit(projectId);
      case 'list':
      case 'ls':
        return this.handleList(projectId);
      case 'remove':
        return this.handleUninstall(args.slice(1), projectId);
      default:
        // Assume it's a script name
        if (command === 'start' || command === 'test' || command === 'build' || command === 'dev') {
          return this.handleRun([command], projectId);
        }
        return { content: `Unknown pnpm command: ${command}`, isError: true };
    }
  }
}

export default new NodeService();