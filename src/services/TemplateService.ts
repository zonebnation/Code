import { File } from '../types/editor';
import { v4 as uuidv4 } from 'uuid';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  framework: string;
  tags: string[];
  icon?: string;
}

class TemplateService {
  private templates: ProjectTemplate[] = [
    {
      id: 'react-app',
      name: 'React Application',
      description: 'A modern React application with hooks and TypeScript',
      framework: 'React',
      tags: ['react', 'typescript', 'frontend'],
      icon: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg'
    },
    {
      id: 'next-app',
      name: 'Next.js Project',
      description: 'Full-stack React framework with server-side rendering',
      framework: 'Next.js',
      tags: ['react', 'next.js', 'fullstack'],
      icon: 'https://raw.githubusercontent.com/vercel/next.js/canary/docs/public/images/next.svg'
    },
    {
      id: 'vue-app',
      name: 'Vue.js Application',
      description: 'Progressive JavaScript framework for building UIs',
      framework: 'Vue',
      tags: ['vue', 'javascript', 'frontend'],
      icon: 'https://vuejs.org/images/logo.png'
    },
    {
      id: 'node-express',
      name: 'Node.js Express API',
      description: 'RESTful API built with Express.js',
      framework: 'Node.js',
      tags: ['node', 'express', 'api', 'backend'],
      icon: 'https://nodejs.org/static/images/logo.svg'
    },
    {
      id: 'html-starter',
      name: 'HTML/CSS/JS Starter',
      description: 'Simple starter with HTML, CSS and vanilla JavaScript',
      framework: 'Vanilla JS',
      tags: ['html', 'css', 'javascript', 'frontend'],
      icon: 'https://www.w3.org/html/logo/downloads/HTML5_Logo_512.png'
    },
    {
      id: 'tailwind-starter',
      name: 'Tailwind CSS Starter',
      description: 'HTML starter with Tailwind CSS configured',
      framework: 'Tailwind CSS',
      tags: ['html', 'tailwind', 'css', 'frontend'],
      icon: 'https://tailwindcss.com/favicons/apple-touch-icon.png'
    }
  ];
  
  /**
   * Get all available templates
   */
  getAllTemplates(): ProjectTemplate[] {
    return this.templates;
  }
  
  /**
   * Get a template by ID
   */
  getTemplateById(id: string): ProjectTemplate | undefined {
    return this.templates.find(template => template.id === id);
  }
  
  /**
   * Get templates by framework
   */
  getTemplatesByFramework(framework: string): ProjectTemplate[] {
    return this.templates.filter(template => template.framework === framework);
  }
  
  /**
   * Search templates by query
   */
  searchTemplates(query: string): ProjectTemplate[] {
    const normalizedQuery = query.toLowerCase();
    return this.templates.filter(template => 
      template.name.toLowerCase().includes(normalizedQuery) ||
      template.description.toLowerCase().includes(normalizedQuery) ||
      template.framework.toLowerCase().includes(normalizedQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
    );
  }
  
  /**
   * Create file structure from a template
   */
  createFilesFromTemplate(templateId: string): File[] {
    // Find the requested template
    const template = this.getTemplateById(templateId);
    if (!template) {
      return this.createDefaultFiles(); // Fallback to default
    }
    
    // Create files based on template
    switch (templateId) {
      case 'react-app':
        return this.createReactTemplate();
      case 'next-app':
        return this.createNextTemplate();
      case 'vue-app':
        return this.createVueTemplate();
      case 'node-express':
        return this.createNodeExpressTemplate();
      case 'tailwind-starter':
        return this.createTailwindTemplate();
      case 'html-starter':
      default:
        return this.createHtmlTemplate();
    }
  }
  
  /**
   * Create default files (fallback)
   */
  private createDefaultFiles(): File[] {
    return [
      {
        id: uuidv4(),
        name: 'index.js',
        type: 'file',
        path: '/index.js',
        content: '// Welcome to Code Canvas!\nconsole.log("Hello, world!");'
      },
      {
        id: uuidv4(),
        name: 'style.css',
        type: 'file',
        path: '/style.css',
        content: '/* Styles for your project */\nbody {\n  font-family: sans-serif;\n  margin: 0;\n  padding: 20px;\n}'
      },
      {
        id: uuidv4(),
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>My Project</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Hello World</h1>\n  <script src="index.js"></script>\n</body>\n</html>'
      }
    ];
  }
  
  /**
   * Create React template
   */
  private createReactTemplate(): File[] {
    const srcFolderId = uuidv4();
    const componentsFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "react-app",\n  "version": "0.1.0",\n  "private": true,\n  "dependencies": {\n    "react": "^18.2.0",\n    "react-dom": "^18.2.0"\n  },\n  "scripts": {\n    "start": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "devDependencies": {\n    "@types/react": "^18.2.15",\n    "@types/react-dom": "^18.2.7",\n    "@vitejs/plugin-react": "^4.0.3",\n    "typescript": "^5.0.2",\n    "vite": "^4.4.5"\n  }\n}'
      },
      {
        id: uuidv4(),
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <title>React App</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.tsx"></script>\n</body>\n</html>'
      },
      {
        id: uuidv4(),
        name: 'tsconfig.json',
        type: 'file',
        path: '/tsconfig.json',
        content: '{\n  "compilerOptions": {\n    "target": "ES2020",\n    "useDefineForClassFields": true,\n    "lib": ["ES2020", "DOM", "DOM.Iterable"],\n    "module": "ESNext",\n    "skipLibCheck": true,\n    "moduleResolution": "bundler",\n    "allowImportingTsExtensions": true,\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "noEmit": true,\n    "jsx": "react-jsx",\n    "strict": true,\n    "noUnusedLocals": true,\n    "noUnusedParameters": true,\n    "noFallthroughCasesInSwitch": true\n  },\n  "include": ["src"],\n  "references": [{ "path": "./tsconfig.node.json" }]\n}'
      },
      {
        id: uuidv4(),
        name: 'tsconfig.node.json',
        type: 'file',
        path: '/tsconfig.node.json',
        content: '{\n  "compilerOptions": {\n    "composite": true,\n    "skipLibCheck": true,\n    "module": "ESNext",\n    "moduleResolution": "bundler",\n    "allowSyntheticDefaultImports": true\n  },\n  "include": ["vite.config.ts"]\n}'
      },
      {
        id: uuidv4(),
        name: 'vite.config.ts',
        type: 'file',
        path: '/vite.config.ts',
        content: 'import { defineConfig } from \'vite\'\nimport react from \'@vitejs/plugin-react\'\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [react()],\n})'
      },
      {
        id: srcFolderId,
        name: 'src',
        type: 'directory',
        path: '/src',
        children: [
          uuidv4(), // main.tsx
          uuidv4(), // App.tsx
          componentsFolderId
        ]
      },
      {
        id: uuidv4(),
        name: 'main.tsx',
        type: 'file',
        path: '/src/main.tsx',
        content: 'import React from \'react\'\nimport ReactDOM from \'react-dom/client\'\nimport App from \'./App\'\nimport \'./index.css\'\n\nReactDOM.createRoot(document.getElementById(\'root\')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>,\n)'
      },
      {
        id: uuidv4(),
        name: 'index.css',
        type: 'file',
        path: '/src/index.css',
        content: 'body {\n  margin: 0;\n  font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', \'Roboto\', \'Oxygen\',\n    \'Ubuntu\', \'Cantarell\', \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\',\n    sans-serif;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}\n\ncode {\n  font-family: source-code-pro, Menlo, Monaco, Consolas, \'Courier New\',\n    monospace;\n}'
      },
      {
        id: uuidv4(),
        name: 'App.tsx',
        type: 'file',
        path: '/src/App.tsx',
        content: 'import { useState } from \'react\'\nimport { Counter } from \'./components/Counter\'\nimport \'./App.css\'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <div className="App">\n      <header className="App-header">\n        <h1>React Application</h1>\n        <p>Edit <code>src/App.tsx</code> and save to reload.</p>\n        <Counter />\n      </header>\n    </div>\n  )\n}\n\nexport default App'
      },
      {
        id: uuidv4(),
        name: 'App.css',
        type: 'file',
        path: '/src/App.css',
        content: '.App {\n  text-align: center;\n}\n\n.App-header {\n  background-color: #282c34;\n  min-height: 100vh;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  font-size: calc(10px + 2vmin);\n  color: white;\n}\n\n.App-link {\n  color: #61dafb;\n}'
      },
      {
        id: componentsFolderId,
        name: 'components',
        type: 'directory',
        path: '/src/components',
        children: [
          uuidv4() // Counter.tsx
        ]
      },
      {
        id: uuidv4(),
        name: 'Counter.tsx',
        type: 'file',
        path: '/src/components/Counter.tsx',
        content: 'import React, { useState } from \'react\';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div style={{ marginTop: 20 }}>\n      <h2>Counter: {count}</h2>\n      <button \n        onClick={() => setCount(count + 1)}\n        style={{\n          backgroundColor: \'#61dafb\',\n          border: \'none\',\n          borderRadius: 8,\n          padding: \'10px 20px\',\n          fontSize: 16,\n          cursor: \'pointer\'\n        }}\n      >\n        Increment\n      </button>\n    </div>\n  );\n}'
      }
    ];
  }
  
  /**
   * Create Next.js template
   */
  private createNextTemplate(): File[] {
    const pagesFolderId = uuidv4();
    const componentsFolderId = uuidv4();
    const stylesFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "nextjs-app",\n  "version": "0.1.0",\n  "private": true,\n  "scripts": {\n    "dev": "next dev",\n    "build": "next build",\n    "start": "next start",\n    "lint": "next lint"\n  },\n  "dependencies": {\n    "next": "13.4.12",\n    "react": "18.2.0",\n    "react-dom": "18.2.0"\n  },\n  "devDependencies": {\n    "@types/node": "20.4.4",\n    "@types/react": "18.2.15",\n    "@types/react-dom": "18.2.7",\n    "typescript": "5.1.6",\n    "eslint": "8.45.0",\n    "eslint-config-next": "13.4.12"\n  }\n}'
      },
      {
        id: uuidv4(),
        name: 'next.config.js',
        type: 'file',
        path: '/next.config.js',
        content: '/** @type {import(\'next\').NextConfig} */\nconst nextConfig = {\n  reactStrictMode: true,\n}\n\nmodule.exports = nextConfig'
      },
      {
        id: uuidv4(),
        name: 'tsconfig.json',
        type: 'file',
        path: '/tsconfig.json',
        content: '{\n  "compilerOptions": {\n    "target": "es5",\n    "lib": ["dom", "dom.iterable", "esnext"],\n    "allowJs": true,\n    "skipLibCheck": true,\n    "strict": true,\n    "forceConsistentCasingInFileNames": true,\n    "noEmit": true,\n    "esModuleInterop": true,\n    "module": "esnext",\n    "moduleResolution": "bundler",\n    "resolveJsonModule": true,\n    "isolatedModules": true,\n    "jsx": "preserve",\n    "incremental": true,\n    "paths": {\n      "@/*": ["./*"]\n    }\n  },\n  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],\n  "exclude": ["node_modules"]\n}'
      },
      {
        id: pagesFolderId,
        name: 'pages',
        type: 'directory',
        path: '/pages',
        children: [
          uuidv4(), // index.tsx
          uuidv4(), // _app.tsx
          uuidv4() // api folder
        ]
      },
      {
        id: uuidv4(),
        name: 'index.tsx',
        type: 'file',
        path: '/pages/index.tsx',
        content: 'import Head from \'next/head\';\nimport { Inter } from \'next/font/google\';\nimport styles from \'../styles/Home.module.css\';\nimport { Counter } from \'../components/Counter\';\n\nconst inter = Inter({ subsets: [\'latin\'] });\n\nexport default function Home() {\n  return (\n    <>\n      <Head>\n        <title>Next.js App</title>\n        <meta name="description" content="Generated by create next app" />\n        <meta name="viewport" content="width=device-width, initial-scale=1" />\n        <link rel="icon" href="/favicon.ico" />\n      </Head>\n      <main className={`${styles.main} ${inter.className}`}>\n        <div className={styles.description}>\n          <h1>Welcome to Next.js!</h1>\n          <p>Get started by editing <code>pages/index.tsx</code></p>\n          <Counter />\n        </div>\n      </main>\n    </>\n  )\n}'
      },
      {
        id: uuidv4(),
        name: '_app.tsx',
        type: 'file',
        path: '/pages/_app.tsx',
        content: 'import \'../styles/globals.css\';\nimport type { AppProps } from \'next/app\';\n\nexport default function App({ Component, pageProps }: AppProps) {\n  return <Component {...pageProps} />\n}'
      },
      {
        id: uuidv4(),
        name: 'api',
        type: 'directory',
        path: '/pages/api',
        children: [
          uuidv4() // hello.ts
        ]
      },
      {
        id: uuidv4(),
        name: 'hello.ts',
        type: 'file',
        path: '/pages/api/hello.ts',
        content: 'import type { NextApiRequest, NextApiResponse } from \'next\';\n\ntype Data = {\n  name: string\n}\n\nexport default function handler(\n  req: NextApiRequest,\n  res: NextApiResponse<Data>\n) {\n  res.status(200).json({ name: \'John Doe\' })\n}'
      },
      {
        id: componentsFolderId,
        name: 'components',
        type: 'directory',
        path: '/components',
        children: [
          uuidv4() // Counter.tsx
        ]
      },
      {
        id: uuidv4(),
        name: 'Counter.tsx',
        type: 'file',
        path: '/components/Counter.tsx',
        content: 'import { useState } from \'react\';\n\nexport function Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <div className="counter">\n      <h2>Counter: {count}</h2>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n      \n      <style jsx>{`\n        .counter {\n          margin: 2rem 0;\n          padding: 1rem;\n          border: 1px solid #eaeaea;\n          border-radius: 10px;\n          text-align: center;\n        }\n        button {\n          background-color: #0070f3;\n          color: white;\n          border: none;\n          border-radius: 8px;\n          padding: 0.5rem 1rem;\n          font-size: 1rem;\n          cursor: pointer;\n          transition: background 0.3s ease;\n        }\n        button:hover {\n          background-color: #0051a2;\n        }\n      `}</style>\n    </div>\n  );\n}'
      },
      {
        id: stylesFolderId,
        name: 'styles',
        type: 'directory',
        path: '/styles',
        children: [
          uuidv4(), // globals.css
          uuidv4() // Home.module.css
        ]
      },
      {
        id: uuidv4(),
        name: 'globals.css',
        type: 'file',
        path: '/styles/globals.css',
        content: ':root {\n  --max-width: 1100px;\n  --border-radius: 12px;\n  --font-mono: ui-monospace, Menlo, Monaco, \'Cascadia Mono\', \'Segoe UI Mono\', \'Roboto Mono\', \'Oxygen Mono\', \'Ubuntu Monospace\', \'Source Code Pro\', \'Fira Mono\', \'Droid Sans Mono\', \'Courier New\', monospace;\n  --foreground-rgb: 0, 0, 0;\n  --background-rgb: 255, 255, 255;\n}\n\n* {\n  box-sizing: border-box;\n  padding: 0;\n  margin: 0;\n}\n\nhtml,\nbody {\n  max-width: 100vw;\n  overflow-x: hidden;\n}\n\nbody {\n  color: rgb(var(--foreground-rgb));\n  background: rgb(var(--background-rgb));\n}\n\na {\n  color: inherit;\n  text-decoration: none;\n}'
      },
      {
        id: uuidv4(),
        name: 'Home.module.css',
        type: 'file',
        path: '/styles/Home.module.css',
        content: '.main {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  padding: 6rem;\n  min-height: 100vh;\n}\n\n.description {\n  display: flex;\n  flex-direction: column;\n  justify-content: center;\n  align-items: center;\n  font-size: 0.85rem;\n  max-width: var(--max-width);\n  width: 100%;\n  z-index: 2;\n  font-family: var(--font-mono);\n}\n\n.description h1 {\n  margin-bottom: 2rem;\n}\n\n.description p {\n  margin-bottom: 2rem;\n}\n\n.description code {\n  font-weight: 700;\n  font-family: var(--font-mono);\n  background-color: rgba(0, 0, 0, 0.1);\n  padding: 0.2rem 0.5rem;\n  border-radius: 0.5rem;\n}'
      }
    ];
  }
  
  /**
   * Create Vue.js template
   */
  private createVueTemplate(): File[] {
    const srcFolderId = uuidv4();
    const componentsFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "vue-app",\n  "version": "0.0.0",\n  "private": true,\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "dependencies": {\n    "vue": "^3.3.4"\n  },\n  "devDependencies": {\n    "@vitejs/plugin-vue": "^4.2.3",\n    "vite": "^4.4.6"\n  }\n}'
      },
      {
        id: uuidv4(),
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8">\n    <link rel="icon" href="/favicon.ico">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Vue App</title>\n  </head>\n  <body>\n    <div id="app"></div>\n    <script type="module" src="/src/main.js"></script>\n  </body>\n</html>'
      },
      {
        id: uuidv4(),
        name: 'vite.config.js',
        type: 'file',
        path: '/vite.config.js',
        content: 'import { defineConfig } from \'vite\'\nimport vue from \'@vitejs/plugin-vue\'\n\n// https://vitejs.dev/config/\nexport default defineConfig({\n  plugins: [vue()],\n})'
      },
      {
        id: srcFolderId,
        name: 'src',
        type: 'directory',
        path: '/src',
        children: [
          uuidv4(), // main.js
          uuidv4(), // App.vue
          componentsFolderId
        ]
      },
      {
        id: uuidv4(),
        name: 'main.js',
        type: 'file',
        path: '/src/main.js',
        content: 'import { createApp } from \'vue\'\nimport App from \'./App.vue\'\nimport \'./assets/main.css\'\n\ncreateApp(App).mount(\'#app\')'
      },
      {
        id: uuidv4(),
        name: 'App.vue',
        type: 'file',
        path: '/src/App.vue',
        content: '<script setup>\nimport HelloWorld from \'./components/HelloWorld.vue\'\n</script>\n\n<template>\n  <header>\n    <div class="wrapper">\n      <h1>Vue.js Application</h1>\n      <HelloWorld msg="You did it!" />\n    </div>\n  </header>\n</template>\n\n<style scoped>\nheader {\n  line-height: 1.5;\n}\n\n.wrapper {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n}\n\nh1 {\n  font-weight: 500;\n  font-size: 2.6rem;\n  margin-bottom: 2rem;\n  text-align: center;\n}\n</style>'
      },
      {
        id: uuidv4(),
        name: 'assets',
        type: 'directory',
        path: '/src/assets',
        children: [
          uuidv4() // main.css
        ]
      },
      {
        id: uuidv4(),
        name: 'main.css',
        type: 'file',
        path: '/src/assets/main.css',
        content: '*,\n*::before,\n*::after {\n  box-sizing: border-box;\n  margin: 0;\n}\n\nbody {\n  min-height: 100vh;\n  color: #333;\n  background: #f8f8f8;\n  transition: color 0.5s, background-color 0.5s;\n  line-height: 1.6;\n  font-family: Inter, -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu,\n    Cantarell, \'Fira Sans\', \'Droid Sans\', \'Helvetica Neue\', sans-serif;\n  font-size: 16px;\n  text-rendering: optimizeLegibility;\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n}'
      },
      {
        id: componentsFolderId,
        name: 'components',
        type: 'directory',
        path: '/src/components',
        children: [
          uuidv4() // HelloWorld.vue
        ]
      },
      {
        id: uuidv4(),
        name: 'HelloWorld.vue',
        type: 'file',
        path: '/src/components/HelloWorld.vue',
        content: '<script setup>\nimport { ref } from \'vue\'\n\ndefineProps({\n  msg: String\n})\n\nconst count = ref(0)\n</script>\n\n<template>\n  <div class="greetings">\n    <h3>{{ msg }}</h3>\n    <h4>You\'ve successfully created a project with Vue 3</h4>\n    \n    <div class="counter">\n      <h2>Counter: {{ count }}</h2>\n      <button @click="count++">Increment</button>\n    </div>\n  </div>\n</template>\n\n<style scoped>\nh3 {\n  font-size: 1.5rem;\n  margin-bottom: 0.5rem;\n}\n\nh4 {\n  font-size: 1.1rem;\n  margin-bottom: 2rem;\n  color: #666;\n}\n\n.counter {\n  margin-top: 2rem;\n  padding: 1rem;\n  border: 1px solid #eaeaea;\n  border-radius: 10px;\n  text-align: center;\n}\n\nbutton {\n  background-color: #42b883;\n  color: white;\n  border: none;\n  border-radius: 8px;\n  padding: 0.5rem 1rem;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: background 0.3s ease;\n}\n\nbutton:hover {\n  background-color: #33a06f;\n}\n</style>'
      }
    ];
  }
  
  /**
   * Create Node.js Express API template
   */
  private createNodeExpressTemplate(): File[] {
    const routesFolderId = uuidv4();
    const controllersFolderId = uuidv4();
    const modelsFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "express-api",\n  "version": "1.0.0",\n  "description": "Express API",\n  "main": "index.js",\n  "scripts": {\n    "start": "node index.js",\n    "dev": "nodemon index.js"\n  },\n  "dependencies": {\n    "express": "^4.18.2",\n    "cors": "^2.8.5",\n    "dotenv": "^16.3.1",\n    "morgan": "^1.10.0"\n  },\n  "devDependencies": {\n    "nodemon": "^3.0.1"\n  }\n}'
      },
      {
        id: uuidv4(),
        name: 'index.js',
        type: 'file',
        path: '/index.js',
        content: 'const express = require(\'express\');\nconst cors = require(\'cors\');\nconst morgan = require(\'morgan\');\nrequire(\'dotenv\').config();\n\nconst app = express();\nconst PORT = process.env.PORT || 3000;\n\n// Middleware\napp.use(cors());\napp.use(express.json());\napp.use(morgan(\'dev\'));\n\n// Routes\napp.use(\'/api\', require(\'./routes\'));\n\n// Default route\napp.get(\'/\', (req, res) => {\n  res.json({ message: \'Welcome to Express API\' });\n});\n\n// Start server\napp.listen(PORT, () => {\n  console.log(`Server running on port ${PORT}`);\n});\n'
      },
      {
        id: uuidv4(),
        name: '.env',
        type: 'file',
        path: '/.env',
        content: 'PORT=3000\nNODE_ENV=development'
      },
      {
        id: uuidv4(),
        name: '.gitignore',
        type: 'file',
        path: '/.gitignore',
        content: 'node_modules\n.env\n.DS_Store'
      },
      {
        id: routesFolderId,
        name: 'routes',
        type: 'directory',
        path: '/routes',
        children: [
          uuidv4(), // index.js
          uuidv4() // users.js
        ]
      },
      {
        id: uuidv4(),
        name: 'index.js',
        type: 'file',
        path: '/routes/index.js',
        content: 'const express = require(\'express\');\nconst router = express.Router();\n\n// Import routes\nconst usersRoutes = require(\'./users\');\n\n// Use routes\nrouter.use(\'/users\', usersRoutes);\n\nmodule.exports = router;'
      },
      {
        id: uuidv4(),
        name: 'users.js',
        type: 'file',
        path: '/routes/users.js',
        content: 'const express = require(\'express\');\nconst router = express.Router();\nconst usersController = require(\'../controllers/users\');\n\n// Routes\nrouter.get(\'/\', usersController.getAllUsers);\nrouter.get(\'/:id\', usersController.getUserById);\nrouter.post(\'/\', usersController.createUser);\nrouter.put(\'/:id\', usersController.updateUser);\nrouter.delete(\'/:id\', usersController.deleteUser);\n\nmodule.exports = router;'
      },
      {
        id: controllersFolderId,
        name: 'controllers',
        type: 'directory',
        path: '/controllers',
        children: [
          uuidv4() // users.js
        ]
      },
      {
        id: uuidv4(),
        name: 'users.js',
        type: 'file',
        path: '/controllers/users.js',
        content: '// Mock database\nconst users = [\n  { id: 1, name: \'John Doe\', email: \'john@example.com\' },\n  { id: 2, name: \'Jane Smith\', email: \'jane@example.com\' }\n];\n\n// Controllers\nexports.getAllUsers = (req, res) => {\n  res.json(users);\n};\n\nexports.getUserById = (req, res) => {\n  const user = users.find(u => u.id === parseInt(req.params.id));\n  if (!user) return res.status(404).json({ message: \'User not found\' });\n  res.json(user);\n};\n\nexports.createUser = (req, res) => {\n  const { name, email } = req.body;\n  if (!name || !email) {\n    return res.status(400).json({ message: \'Name and email are required\' });\n  }\n  \n  const newUser = {\n    id: users.length + 1,\n    name,\n    email\n  };\n  \n  users.push(newUser);\n  res.status(201).json(newUser);\n};\n\nexports.updateUser = (req, res) => {\n  const user = users.find(u => u.id === parseInt(req.params.id));\n  if (!user) return res.status(404).json({ message: \'User not found\' });\n  \n  const { name, email } = req.body;\n  if (name) user.name = name;\n  if (email) user.email = email;\n  \n  res.json(user);\n};\n\nexports.deleteUser = (req, res) => {\n  const index = users.findIndex(u => u.id === parseInt(req.params.id));\n  if (index === -1) return res.status(404).json({ message: \'User not found\' });\n  \n  const deletedUser = users.splice(index, 1);\n  res.json(deletedUser[0]);\n};'
      },
      {
        id: modelsFolderId,
        name: 'models',
        type: 'directory',
        path: '/models',
        children: [
          uuidv4() // User.js
        ]
      },
      {
        id: uuidv4(),
        name: 'User.js',
        type: 'file',
        path: '/models/User.js',
        content: '// This is a placeholder for a real database model\n// In a real app, you might use Mongoose, Sequelize, etc.\n\nclass User {\n  constructor(id, name, email) {\n    this.id = id;\n    this.name = name;\n    this.email = email;\n  }\n  \n  // Static methods to interact with the "database"\n  static getAll() {\n    // In a real app, this would query a database\n    return [];\n  }\n  \n  static getById(id) {\n    // In a real app, this would query a database\n    return null;\n  }\n  \n  static create(data) {\n    // In a real app, this would insert into a database\n    return new User(1, data.name, data.email);\n  }\n}\n\nmodule.exports = User;'
      }
    ];
  }
  
  /**
   * Create HTML/CSS/JS template
   */
  private createHtmlTemplate(): File[] {
    const cssFolderId = uuidv4();
    const jsFolderId = uuidv4();
    const imgFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>HTML Starter</title>\n  <link rel="stylesheet" href="css/style.css">\n</head>\n<body>\n  <header>\n    <nav>\n      <ul>\n        <li><a href="index.html">Home</a></li>\n        <li><a href="#">About</a></li>\n        <li><a href="#">Contact</a></li>\n      </ul>\n    </nav>\n  </header>\n  \n  <main>\n    <section class="hero">\n      <h1>Welcome to HTML Starter</h1>\n      <p>A simple starter template with HTML, CSS, and vanilla JavaScript</p>\n      <button id="counter-btn">Click me: <span id="counter">0</span></button>\n    </section>\n    \n    <section class="features">\n      <div class="feature">\n        <h2>HTML5</h2>\n        <p>Modern semantic markup</p>\n      </div>\n      <div class="feature">\n        <h2>CSS3</h2>\n        <p>Beautiful styling capabilities</p>\n      </div>\n      <div class="feature">\n        <h2>JavaScript</h2>\n        <p>Interactive functionality</p>\n      </div>\n    </section>\n  </main>\n  \n  <footer>\n    <p>&copy; 2025 HTML Starter. All rights reserved.</p>\n  </footer>\n  \n  <script src="js/main.js"></script>\n</body>\n</html>'
      },
      {
        id: cssFolderId,
        name: 'css',
        type: 'directory',
        path: '/css',
        children: [
          uuidv4() // style.css
        ]
      },
      {
        id: uuidv4(),
        name: 'style.css',
        type: 'file',
        path: '/css/style.css',
        content: '* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n}\n\nheader {\n  background-color: #333;\n  padding: 1rem 0;\n}\n\nnav ul {\n  display: flex;\n  list-style: none;\n  justify-content: center;\n}\n\nnav ul li {\n  margin: 0 1rem;\n}\n\nnav a {\n  color: white;\n  text-decoration: none;\n}\n\nnav a:hover {\n  text-decoration: underline;\n}\n\n.hero {\n  background-color: #f4f4f4;\n  padding: 4rem 2rem;\n  text-align: center;\n}\n\n.hero h1 {\n  font-size: 2.5rem;\n  margin-bottom: 1rem;\n}\n\n.hero p {\n  font-size: 1.2rem;\n  margin-bottom: 2rem;\n  color: #666;\n}\n\n.features {\n  display: flex;\n  flex-wrap: wrap;\n  justify-content: space-between;\n  padding: 3rem 2rem;\n}\n\n.feature {\n  flex: 1;\n  min-width: 300px;\n  text-align: center;\n  padding: 2rem;\n  margin: 1rem;\n  background-color: white;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n}\n\nfooter {\n  text-align: center;\n  padding: 2rem;\n  background-color: #333;\n  color: white;\n}\n\nbutton {\n  background-color: #4CAF50;\n  border: none;\n  color: white;\n  padding: 12px 24px;\n  text-align: center;\n  text-decoration: none;\n  display: inline-block;\n  font-size: 16px;\n  margin: 4px 2px;\n  cursor: pointer;\n  border-radius: 4px;\n  transition: background 0.3s ease;\n}\n\nbutton:hover {\n  background-color: #45a049;\n}'
      },
      {
        id: jsFolderId,
        name: 'js',
        type: 'directory',
        path: '/js',
        children: [
          uuidv4() // main.js
        ]
      },
      {
        id: uuidv4(),
        name: 'main.js',
        type: 'file',
        path: '/js/main.js',
        content: '// Counter functionality\ndocument.addEventListener(\'DOMContentLoaded\', () => {\n  const counterBtn = document.getElementById(\'counter-btn\');\n  const counterElement = document.getElementById(\'counter\');\n  let count = 0;\n  \n  if (counterBtn && counterElement) {\n    counterBtn.addEventListener(\'click\', () => {\n      count++;\n      counterElement.textContent = count;\n      \n      // Change button color after 10 clicks\n      if (count === 10) {\n        counterBtn.style.backgroundColor = \'#FF5722\';\n        counterBtn.innerText = `You clicked ${count} times!`;\n        setTimeout(() => {\n          counterBtn.style.backgroundColor = \'#4CAF50\';\n          counterBtn.innerHTML = `Click me: <span id="counter">${count}</span>`;\n          counterElement = document.getElementById(\'counter\');\n        }, 2000);\n      }\n    });\n  }\n  \n  // Add smooth scrolling to all links\n  const links = document.querySelectorAll(\'a[href^="#"]\');\n  \n  for (const link of links) {\n    link.addEventListener(\'click\', function(e) {\n      e.preventDefault();\n      const target = document.querySelector(this.getAttribute(\'href\'));\n      if (target) {\n        window.scrollTo({\n          top: target.offsetTop,\n          behavior: \'smooth\'\n        });\n      }\n    });\n  }\n});'
      },
      {
        id: imgFolderId,
        name: 'img',
        type: 'directory',
        path: '/img',
        children: []
      }
    ];
  }
  
  /**
   * Create Tailwind CSS template
   */
  private createTailwindTemplate(): File[] {
    const srcFolderId = uuidv4();
    
    return [
      {
        id: uuidv4(),
        name: 'package.json',
        type: 'file',
        path: '/package.json',
        content: '{\n  "name": "tailwind-starter",\n  "version": "1.0.0",\n  "description": "Tailwind CSS starter",\n  "scripts": {\n    "start": "vite",\n    "build": "vite build",\n    "preview": "vite preview"\n  },\n  "devDependencies": {\n    "autoprefixer": "^10.4.14",\n    "postcss": "^8.4.26",\n    "tailwindcss": "^3.3.3",\n    "vite": "^4.4.6"\n  }\n}'
      },
      {
        id: uuidv4(),
        name: 'index.html',
        type: 'file',
        path: '/index.html',
        content: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Tailwind CSS Starter</title>\n  <link rel="stylesheet" href="/src/style.css">\n</head>\n<body class="bg-gray-100 font-sans leading-normal tracking-normal">\n  <header class="bg-white shadow-md">\n    <nav class="container mx-auto px-6 py-4">\n      <div class="flex justify-between items-center">\n        <div>\n          <a class="text-xl font-bold text-gray-800" href="#">Tailwind Starter</a>\n        </div>\n        <div class="space-x-6">\n          <a class="hover:text-blue-500" href="#">Home</a>\n          <a class="hover:text-blue-500" href="#">About</a>\n          <a class="hover:text-blue-500" href="#">Contact</a>\n        </div>\n      </div>\n    </nav>\n  </header>\n\n  <main>\n    <section class="py-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">\n      <div class="container mx-auto px-6 text-center">\n        <h1 class="text-4xl font-bold mb-6">Welcome to Tailwind CSS Starter</h1>\n        <p class="text-xl mb-12">A utility-first CSS framework for rapidly building custom designs.</p>\n        <button id="counter-btn" class="bg-white text-blue-500 px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">Clicked <span id="counter">0</span> times</button>\n      </div>\n    </section>\n\n    <section class="container mx-auto px-6 py-16">\n      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">\n        <div class="bg-white rounded-lg p-8 shadow-md">\n          <h2 class="text-2xl font-bold mb-4 text-gray-800">Responsive</h2>\n          <p class="text-gray-600">Tailwind is fully responsive, allowing you to build layouts for any screen size.</p>\n        </div>\n        <div class="bg-white rounded-lg p-8 shadow-md">\n          <h2 class="text-2xl font-bold mb-4 text-gray-800">Customizable</h2>\n          <p class="text-gray-600">Easily customize your design by modifying the configuration file.</p>\n        </div>\n        <div class="bg-white rounded-lg p-8 shadow-md">\n          <h2 class="text-2xl font-bold mb-4 text-gray-800">Utility-First</h2>\n          <p class="text-gray-600">Compose complex designs by combining utility classes.</p>\n        </div>\n      </div>\n    </section>\n  </main>\n\n  <footer class="bg-gray-800 text-white py-8">\n    <div class="container mx-auto px-6 text-center">\n      <p>&copy; 2025 Tailwind Starter. All rights reserved.</p>\n    </div>\n  </footer>\n\n  <script src="/src/main.js"></script>\n</body>\n</html>'
      },
      {
        id: uuidv4(),
        name: 'tailwind.config.js',
        type: 'file',
        path: '/tailwind.config.js',
        content: '/** @type {import(\'tailwindcss\').Config} */\nmodule.exports = {\n  content: [\n    "./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",\n  ],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n}'
      },
      {
        id: uuidv4(),
        name: 'postcss.config.js',
        type: 'file',
        path: '/postcss.config.js',
        content: 'module.exports = {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}'
      },
      {
        id: uuidv4(),
        name: 'vite.config.js',
        type: 'file',
        path: '/vite.config.js',
        content: 'export default {\n  build: {\n    outDir: \'dist\',\n  },\n  server: {\n    port: 3000,\n    open: true,\n  },\n}'
      },
      {
        id: srcFolderId,
        name: 'src',
        type: 'directory',
        path: '/src',
        children: [
          uuidv4(), // style.css
          uuidv4() // main.js
        ]
      },
      {
        id: uuidv4(),
        name: 'style.css',
        type: 'file',
        path: '/src/style.css',
        content: '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n'
      },
      {
        id: uuidv4(),
        name: 'main.js',
        type: 'file',
        path: '/src/main.js',
        content: '// Counter functionality\ndocument.addEventListener(\'DOMContentLoaded\', () => {\n  const counterBtn = document.getElementById(\'counter-btn\');\n  const counterElement = document.getElementById(\'counter\');\n  let count = 0;\n  \n  if (counterBtn && counterElement) {\n    counterBtn.addEventListener(\'click\', () => {\n      count++;\n      counterElement.textContent = count;\n      \n      // Add more dynamic effects with Tailwind classes\n      if (count % 5 === 0) {\n        // Toggle classes every 5 clicks\n        counterBtn.classList.toggle(\'bg-white\');\n        counterBtn.classList.toggle(\'text-blue-500\');\n        counterBtn.classList.toggle(\'bg-yellow-400\');\n        counterBtn.classList.toggle(\'text-gray-900\');\n      }\n    });\n  }\n});'
      }
    ];
  }
}

export default new TemplateService();