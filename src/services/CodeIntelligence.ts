import { CompletionItem } from '../components/Editor/CodeCompletion';

type LanguageKeywords = Record<string, string[]>;
type BuiltInObjects = Record<string, string[]>;
type SnippetDefinition = {
  prefix: string;
  body: string;
  description: string;
};

type SnippetMap = Record<string, SnippetDefinition[]>;

class CodeIntelligenceService {
  private keywords: LanguageKeywords = {
    javascript: [
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'false', 
      'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'new', 'null', 
      'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 
      'void', 'while', 'yield'
    ],
    typescript: [
      'abstract', 'any', 'as', 'asserts', 'async', 'await', 'boolean', 'break', 
      'case', 'catch', 'class', 'const', 'continue', 'debugger', 'declare', 'default', 
      'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 
      'from', 'function', 'get', 'if', 'implements', 'import', 'in', 'infer', 'instanceof', 
      'interface', 'is', 'keyof', 'let', 'module', 'namespace', 'never', 'new', 'null', 
      'number', 'object', 'of', 'package', 'private', 'protected', 'public', 'readonly', 
      'return', 'require', 'global', 'set', 'static', 'string', 'super', 'switch', 
      'symbol', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined', 'unique', 
      'unknown', 'var', 'void', 'while', 'with', 'yield'
    ],
    css: [
      'align-content', 'align-items', 'align-self', 'background', 'background-color', 
      'border', 'border-radius', 'box-shadow', 'color', 'display', 'flex', 'flex-direction', 
      'font-family', 'font-size', 'font-weight', 'grid', 'height', 'justify-content', 
      'margin', 'margin-top', 'margin-bottom', 'margin-left', 'margin-right', 
      'padding', 'padding-top', 'padding-bottom', 'padding-left', 'padding-right', 
      'position', 'width'
    ],
    html: [
      'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'img', 'button', 
      'form', 'input', 'label', 'select', 'option', 'textarea', 'ul', 'ol', 'li', 
      'table', 'tr', 'td', 'th', 'thead', 'tbody', 'section', 'article', 'header', 
      'footer', 'nav', 'main', 'aside'
    ]
  };

  private builtIns: BuiltInObjects = {
    javascript: [
      'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
      'Object', 'Promise', 'RegExp', 'String', 'console', 'document', 'window',
      'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'fetch',
      'Map', 'Set', 'WeakMap', 'WeakSet'
    ],
    typescript: [
      'Array', 'Boolean', 'Date', 'Error', 'Function', 'JSON', 'Math', 'Number',
      'Object', 'Promise', 'RegExp', 'String', 'console', 'document', 'window',
      'localStorage', 'sessionStorage', 'setTimeout', 'setInterval', 'fetch',
      'Map', 'Set', 'WeakMap', 'WeakSet', 'any', 'boolean', 'number', 'string',
      'void', 'undefined', 'null', 'never', 'object'
    ]
  };

  private snippets: SnippetMap = {
    javascript: [
      {
        prefix: 'cl',
        body: 'console.log($1);',
        description: 'console.log statement'
      },
      {
        prefix: 'fn',
        body: 'function $1($2) {\n  $3\n}',
        description: 'Function declaration'
      },
      {
        prefix: 'afn',
        body: '($1) => {\n  $2\n}',
        description: 'Arrow function'
      },
      {
        prefix: 'if',
        body: 'if ($1) {\n  $2\n}',
        description: 'If statement'
      },
      {
        prefix: 'ife',
        body: 'if ($1) {\n  $2\n} else {\n  $3\n}',
        description: 'If-else statement'
      },
      {
        prefix: 'for',
        body: 'for (let i = 0; i < $1; i++) {\n  $2\n}',
        description: 'For loop'
      }
    ],
    typescript: [
      {
        prefix: 'cl',
        body: 'console.log($1);',
        description: 'console.log statement'
      },
      {
        prefix: 'fn',
        body: 'function $1($2): $3 {\n  $4\n}',
        description: 'Function declaration with type'
      },
      {
        prefix: 'afn',
        body: '($1): $2 => {\n  $3\n}',
        description: 'Arrow function with type'
      },
      {
        prefix: 'int',
        body: 'interface $1 {\n  $2\n}',
        description: 'Interface declaration'
      },
      {
        prefix: 'type',
        body: 'type $1 = $2;',
        description: 'Type alias'
      }
    ],
    react: [
      {
        prefix: 'rfc',
        body: 'import React from \'react\';\n\ninterface ${1:ComponentName}Props {\n  $2\n}\n\nconst ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ($3) => {\n  return (\n    <div>\n      $4\n    </div>\n  );\n};\n\nexport default ${1:ComponentName};',
        description: 'React Functional Component with TypeScript'
      },
      {
        prefix: 'useState',
        body: 'const [$1, set${1/(.*)/${1:/capitalize}/}] = useState<$2>($3);',
        description: 'React useState hook'
      },
      {
        prefix: 'useEffect',
        body: 'useEffect(() => {\n  $1\n  \n  return () => {\n    $2\n  };\n}, [$3]);',
        description: 'React useEffect hook'
      }
    ],
  };

  // Simple parsing for extracting variables/functions from current scope
  private extractContextualCompletions(code: string, cursorPosition: number, language: string): CompletionItem[] {
    const completions: CompletionItem[] = [];
    
    // Extract all variable declarations and function declarations before cursor
    const codeBeforeCursor = code.substring(0, cursorPosition);
    
    // Match variable declarations (var, let, const)
    const varRegex = /(var|let|const)\s+(\w+)(\s*=\s*([^;]+))?/g;
    let match;
    while ((match = varRegex.exec(codeBeforeCursor)) !== null) {
      const varName = match[2];
      
      completions.push({
        label: varName,
        kind: 'variable',
        insertText: varName
      });
    }
    
    // Match function declarations
    const funcRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    while ((match = funcRegex.exec(codeBeforeCursor)) !== null) {
      const funcName = match[1];
      const params = match[2].split(',').map(p => p.trim()).filter(Boolean);
      
      completions.push({
        label: funcName,
        kind: 'function',
        detail: `(${params.join(', ')}) => {...}`,
        insertText: `${funcName}(${params.map((_, i) => `\${${i + 1}}`).join(', ')})`
      });
    }
    
    // Match class declarations
    const classRegex = /class\s+(\w+)(\s+extends\s+(\w+))?/g;
    while ((match = classRegex.exec(codeBeforeCursor)) !== null) {
      const className = match[1];
      const extendsClass = match[3] || '';
      
      completions.push({
        label: className,
        kind: 'class',
        detail: extendsClass ? `extends ${extendsClass}` : '',
        insertText: className
      });
    }
    
    return completions;
  }

  // Get keyword completions for a given language
  private getKeywordCompletions(language: string): CompletionItem[] {
    const lang = this.normalizeLanguage(language);
    if (!this.keywords[lang]) return [];
    
    return this.keywords[lang].map(keyword => ({
      label: keyword,
      kind: 'keyword',
      insertText: keyword
    }));
  }
  
  // Get built-in object completions
  private getBuiltInCompletions(language: string): CompletionItem[] {
    const lang = this.normalizeLanguage(language);
    if (!this.builtIns[lang]) return [];
    
    return this.builtIns[lang].map(item => ({
      label: item,
      kind: item[0] === item[0].toUpperCase() ? 'class' : 'property',
      insertText: item
    }));
  }
  
  // Get snippet completions
  private getSnippetCompletions(language: string): CompletionItem[] {
    const lang = this.normalizeLanguage(language);
    
    // Include React snippets for JSX/TSX files
    const snippetsList = [
      ...(this.snippets[lang] || []),
      ...(language === 'jsx' || language === 'tsx' ? this.snippets['react'] || [] : [])
    ];
    
    if (!snippetsList.length) return [];
    
    return snippetsList.map(snippet => ({
      label: snippet.prefix,
      kind: 'snippet',
      detail: snippet.description,
      documentation: snippet.body,
      insertText: snippet.body
    }));
  }

  // Maps our language names to the ones in our data structures
  private normalizeLanguage(language: string): string {
    switch (language) {
      case 'jsx':
        return 'javascript';
      case 'tsx':
        return 'typescript';
      default:
        return language;
    }
  }

  // Get all completions for a given code context
  getCompletions(
    code: string,
    cursorPosition: number,
    language: string,
    prefix: string = ''
  ): CompletionItem[] {
    // Get all different types of completions
    const contextual = this.extractContextualCompletions(code, cursorPosition, language);
    const keywords = this.getKeywordCompletions(language);
    const builtIns = this.getBuiltInCompletions(language);
    const snippets = this.getSnippetCompletions(language);
    
    // Combine all completions
    const allCompletions = [...contextual, ...builtIns, ...keywords, ...snippets];
    
    // Filter by prefix if provided
    if (prefix) {
      return allCompletions.filter(item => 
        item.label.toLowerCase().startsWith(prefix.toLowerCase())
      );
    }
    
    return allCompletions;
  }

  // Parse and analyze code to provide diagnostics
  getLintDiagnostics(code: string, language: string): { message: string; line: number; column: number; severity: 'error' | 'warning' | 'info' }[] {
    const diagnostics: { message: string; line: number; column: number; severity: 'error' | 'warning' | 'info' }[] = [];
    
    // This is a very simple implementation
    // A real implementation would use actual language parsers
    
    if (language === 'javascript' || language === 'jsx' || language === 'typescript' || language === 'tsx') {
      // Check for missing semicolons
      const lines = code.split('\n');
      lines.forEach((line, lineIndex) => {
        // Simple heuristic: if line ends with an identifier or `)` and doesn't have semicolon, it might need one
        if (/[a-zA-Z0-9_)\]]['"]?$/.test(line) && !line.trim().endsWith(';') && 
            !line.trim().endsWith('{') && !line.trim().endsWith('}') &&
            !line.trim().startsWith('import') && !line.trim().startsWith('export')) {
          diagnostics.push({
            message: 'Missing semicolon',
            line: lineIndex + 1,
            column: line.length,
            severity: 'warning'
          });
        }
        
        // Check for console.log statements (often left in code accidentally)
        if (line.includes('console.log') && !line.startsWith('//')) {
          diagnostics.push({
            message: 'console.log statement found',
            line: lineIndex + 1,
            column: line.indexOf('console.log'),
            severity: 'info'
          });
        }
      });
      
      // Check for unclosed brackets
      const openBrackets: { char: string; line: number; column: number }[] = [];
      const bracketPairs: Record<string, string> = {
        '(': ')',
        '{': '}',
        '[': ']'
      };
      
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (let colIndex = 0; colIndex < line.length; colIndex++) {
          const char = line[colIndex];
          
          if (char === '(' || char === '{' || char === '[') {
            openBrackets.push({ char, line: lineIndex + 1, column: colIndex + 1 });
          } else if (char === ')' || char === '}' || char === ']') {
            if (openBrackets.length === 0) {
              diagnostics.push({
                message: `Unexpected closing bracket '${char}'`,
                line: lineIndex + 1,
                column: colIndex + 1,
                severity: 'error'
              });
            } else {
              const lastBracket = openBrackets.pop()!;
              if (bracketPairs[lastBracket.char] !== char) {
                diagnostics.push({
                  message: `Mismatched bracket: expected '${bracketPairs[lastBracket.char]}', found '${char}'`,
                  line: lineIndex + 1,
                  column: colIndex + 1,
                  severity: 'error'
                });
              }
            }
          }
        }
      }
      
      // Report unclosed brackets
      for (const bracket of openBrackets) {
        diagnostics.push({
          message: `Unclosed bracket '${bracket.char}'`,
          line: bracket.line,
          column: bracket.column,
          severity: 'error'
        });
      }
    }
    
    return diagnostics;
  }
}

export default new CodeIntelligenceService();