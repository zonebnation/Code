import { LintIssue } from './LinterService';

/**
 * A lightweight ESLint-like service for basic code linting
 * This is a simplified version that doesn't require the full ESLint package
 */
class EslintService {
  // Basic rule implementations
  private rules: Record<string, (code: string) => LintIssue[]> = {
    'no-console': (code: string) => {
      const issues: LintIssue[] = [];
      const regex = /console\.(log|warn|error|info|debug)/g;
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        // Get line and column for the match
        const textBeforeMatch = code.substring(0, match.index);
        const lines = textBeforeMatch.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        issues.push({
          line,
          column,
          message: `Unexpected console statement (${match[1]})`,
          severity: 'warning',
          source: match[0],
          ruleId: 'no-console'
        });
      }
      
      return issues;
    },
    
    'no-var': (code: string) => {
      const issues: LintIssue[] = [];
      const regex = /\bvar\b/g;
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const textBeforeMatch = code.substring(0, match.index);
        const lines = textBeforeMatch.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        issues.push({
          line,
          column,
          message: 'Unexpected var, use let or const instead',
          severity: 'warning',
          source: 'var',
          ruleId: 'no-var'
        });
      }
      
      return issues;
    },
    
    'prefer-const': (code: string) => {
      const issues: LintIssue[] = [];
      // This is a simplified implementation that just looks for let declarations
      // without reassignments (not a full static analysis)
      const regex = /\blet\s+([a-zA-Z_$][a-zA-Z0-9_$]*)(?:\s*=\s*[^;]+)?;/g;
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const variableName = match[1];
        
        // Very simple check - if variable name doesn't appear in an assignment expression
        if (!new RegExp(`\\b${variableName}\\s*=`).test(code)) {
          const textBeforeMatch = code.substring(0, match.index);
          const lines = textBeforeMatch.split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          
          issues.push({
            line,
            column,
            message: `'${variableName}' is never reassigned; use 'const' instead`,
            severity: 'info',
            source: match[0],
            ruleId: 'prefer-const'
          });
        }
      }
      
      return issues;
    },
    
    'eqeqeq': (code: string) => {
      const issues: LintIssue[] = [];
      // Look for == and != operators that aren't part of === or !==
      const regex = /([^=!])={2}([^=])|([^!])!={1}([^=])/g;
      let match;
      
      while ((match = regex.exec(code)) !== null) {
        const textBeforeMatch = code.substring(0, match.index);
        const lines = textBeforeMatch.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        const operator = code.substring(match.index, match.index + match[0].length).includes('==') ? '==' : '!=';
        const replacement = operator === '==' ? '===' : '!==';
        
        issues.push({
          line,
          column,
          message: `Expected '${replacement}' and instead saw '${operator}'`,
          severity: 'warning',
          source: operator,
          ruleId: 'eqeqeq'
        });
      }
      
      return issues;
    },
    
    'semi': (code: string) => {
      const issues: LintIssue[] = [];
      // This is very simplified and may produce false positives
      const lines = code.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines, comments, and lines that end with certain characters
        if (line === '' || 
            line.startsWith('//') || 
            line.startsWith('/*') ||
            line.endsWith(';') ||
            line.endsWith('{') || 
            line.endsWith('}') ||
            line.endsWith(':') ||
            line.endsWith(',') ||
            line.startsWith('import ') || 
            line.startsWith('export ')) {
          continue;
        }
        
        // Skip if next line starts with a chain operator
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        if (nextLine.startsWith('.') || nextLine.startsWith('?') || nextLine.startsWith(':')) {
          continue;
        }
        
        issues.push({
          line: i + 1,
          column: lines[i].length + 1,
          message: 'Missing semicolon',
          severity: 'warning',
          ruleId: 'semi'
        });
      }
      
      return issues;
    },
    
    'no-unused-vars': (code: string) => {
      const issues: LintIssue[] = [];
      // This is a simplified implementation, not full static analysis
      
      // Find all variable declarations
      const declarationRegex = /(?:var|let|const|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
      const declarations = new Map<string, { line: number, column: number }>();
      let match;
      
      while ((match = declarationRegex.exec(code)) !== null) {
        const varName = match[1];
        if (!declarations.has(varName)) {
          const textBeforeMatch = code.substring(0, match.index);
          const lines = textBeforeMatch.split('\n');
          const line = lines.length;
          const column = lines[lines.length - 1].length + 1;
          
          declarations.set(varName, { line, column });
        }
      }
      
      // Check if declarations are used elsewhere in the code
      declarations.forEach((position, varName) => {
        // Skip function parameters and common variables
        if (['props', 'state', 'e', 'event', 'err', 'error'].includes(varName)) {
          return;
        }
        
        // Create a regex that will find uses of this variable
        const useRegex = new RegExp(`\\b${varName}\\b(?!\\s*([,;]\\s*\\b(var|let|const|function)\\b|\\s*=))`, 'g');
        
        // Count occurrences
        const useMatches = code.match(useRegex);
        const count = useMatches ? useMatches.length : 0;
        
        // If only one occurrence (the declaration itself), it's unused
        if (count <= 1) {
          issues.push({
            line: position.line,
            column: position.column,
            message: `'${varName}' is defined but never used`,
            severity: 'warning',
            source: varName,
            ruleId: 'no-unused-vars'
          });
        }
      });
      
      return issues;
    }
  };
  
  /**
   * Lint code with selected rules
   */
  lintCode(
    code: string, 
    language: string,
    enabledRules: Record<string, boolean> = {
      'no-console': true,
      'no-var': true,
      'prefer-const': true,
      'eqeqeq': true,
      'semi': true,
      'no-unused-vars': true
    }
  ): LintIssue[] {
    if (!code || !language) {
      return [];
    }
    
    // Skip linting for non-JS/TS files
    if (!['javascript', 'typescript', 'jsx', 'tsx'].includes(language)) {
      return [];
    }
    
    const allIssues: LintIssue[] = [];
    
    // Run enabled rules
    Object.entries(enabledRules).forEach(([ruleId, isEnabled]) => {
      if (isEnabled && this.rules[ruleId]) {
        const issues = this.rules[ruleId](code);
        allIssues.push(...issues);
      }
    });
    
    // Sort issues by line and column
    return allIssues.sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return a.column - b.column;
    });
  }
}

export default new EslintService();