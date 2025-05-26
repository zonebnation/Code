import { Project } from '../types/editor';

export const sampleProjects: Project[] = [
  {
    id: 'project-1',
    name: 'JavaScript Demo',
    path: '/projects/javascript-demo',
    files: [
      {
        id: 'file-1',
        name: 'index.js',
        type: 'file',
        path: '/index.js',
        content: '// Welcome to Code Canvas!\n\nconst greeting = "Hello, world!";\nconsole.log(greeting);\n\n// Demo function\nfunction calculateSum(a, b) {\n  return a + b;\n}\n\nconst result = calculateSum(5, 7);\nconsole.log(`The sum is ${result}`);',
      },
      {
        id: 'file-2',
        name: 'style.css',
        type: 'file',
        path: '/style.css',
        content: '/* Main styles */\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  margin: 0;\n  padding: 20px;\n  background-color: #f5f5f5;\n}\n\n.container {\n  max-width: 800px;\n  margin: 0 auto;\n  background-color: white;\n  padding: 20px;\n  border-radius: 8px;\n  box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n}',
      },
      {
        id: 'folder-1',
        name: 'src',
        type: 'directory',
        path: '/src',
        children: ['file-3', 'file-4'],
      },
      {
        id: 'file-3',
        name: 'app.js',
        type: 'file',
        path: '/src/app.js',
        content: '// Application logic\nclass App {\n  constructor() {\n    this.name = "Code Canvas App";\n    this.version = "1.0.0";\n  }\n\n  initialize() {\n    console.log(`${this.name} v${this.version} initialized`);\n  }\n\n  run() {\n    this.initialize();\n    console.log("App is running...");\n  }\n}\n\nconst app = new App();\napp.run();',
      },
      {
        id: 'file-4',
        name: 'utils.js',
        type: 'file',
        path: '/src/utils.js',
        content: '// Utility functions\n\n/**\n * Formats a date to a readable string\n * @param {Date} date - The date to format\n * @return {string} Formatted date string\n */\nexport function formatDate(date) {\n  return new Date(date).toLocaleDateString("en-US", {\n    year: "numeric",\n    month: "long",\n    day: "numeric"\n  });\n}\n\n/**\n * Generates a random ID\n * @param {number} length - Length of the ID\n * @return {string} Random ID\n */\nexport function generateId(length = 8) {\n  return Math.random().toString(36).substring(2, 2 + length);\n}\n',
      },
    ],
    createdAt: '2023-09-15T12:00:00.000Z',
  },
  {
    id: 'project-2',
    name: 'React Sample',
    path: '/projects/react-sample',
    files: [
      {
        id: 'react-file-1',
        name: 'App.jsx',
        type: 'file',
        path: '/App.jsx',
        content: 'import React, { useState } from "react";\nimport "./styles.css";\n\nfunction App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="app">\n      <h1>React Counter</h1>\n      <div className="card">\n        <button onClick={() => setCount((count) => count + 1)}>\n          count is {count}\n        </button>\n        <p>\n          Edit <code>src/App.jsx</code> and save to test\n        </p>\n      </div>\n    </div>\n  );\n}\n\nexport default App;',
      },
      {
        id: 'react-file-2',
        name: 'styles.css',
        type: 'file',
        path: '/styles.css',
        content: '* {\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;\n  margin: 0;\n  padding: 0;\n  display: flex;\n  place-items: center;\n  min-width: 320px;\n  min-height: 100vh;\n  background-color: #f5f5f5;\n}\n\n#root {\n  max-width: 1280px;\n  margin: 0 auto;\n  padding: 2rem;\n  text-align: center;\n}\n\n.app {\n  padding: 2rem;\n  background-color: white;\n  border-radius: 8px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n}\n\nh1 {\n  font-size: 2.5em;\n  line-height: 1.1;\n  margin-bottom: 1rem;\n  color: #213547;\n}\n\n.card {\n  padding: 2em;\n}\n\nbutton {\n  border-radius: 8px;\n  border: 1px solid transparent;\n  padding: 0.6em 1.2em;\n  font-size: 1em;\n  font-weight: 500;\n  font-family: inherit;\n  background-color: #0078d7;\n  color: white;\n  cursor: pointer;\n  transition: border-color 0.25s;\n}\n\nbutton:hover {\n  border-color: #646cff;\n}\n\nbutton:focus,\nbutton:focus-visible {\n  outline: 4px auto -webkit-focus-ring-color;\n}',
      },
      {
        id: 'react-file-3',
        name: 'main.jsx',
        type: 'file',
        path: '/main.jsx',
        content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\nimport "./styles.css";\n\nReactDOM.createRoot(document.getElementById("root")).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);',
      },
    ],
    createdAt: '2023-10-05T15:30:00.000Z',
  },
];