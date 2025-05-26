import { useEffect, useState } from 'react';

export type LintIssue = {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  source?: string;
  ruleId?: string;
};

export type LintResult = {
  issues: LintIssue[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
};

class LinterService {
  // Simple patterns for basic linting
  private patterns = {
    // JavaScript/TypeScript patterns
    javascript: [
      { 
        pattern: /console\.log/g, 
        message: 'Avoid using console.log in production code', 
        severity: 'warning' as const 
      },
      { 
        pattern: /(?<!\w)var\s+/g, 
        message: 'Use const or let instead of var', 
        severity: 'warning' as const 
      },
      {
        pattern: /==[^=]/g,
        message: 'Use === instead of == for equality comparisons',
        severity: 'warning' as const
      },
      {
        pattern: /!=[^=]/g,
        message: 'Use !== instead of != for equality comparisons',
        severity: 'warning' as const
      },
      {
        pattern: /\/\/\s*TODO/g,
        message: 'TODO comment found',
        severity: 'info' as const
      },
      {
        pattern: /new\s+Array\(/g,
        message: 'Use array literal notation [] instead of new Array()',
        severity: 'warning' as const
      },
      {
        pattern: /new\s+Object\(/g,
        message: 'Use object literal notation {} instead of new Object()',
        severity: 'warning' as const
      },
      {
        pattern: /function\*[^(]*\(/g,
        message: 'Generator functions require proper error handling',
        severity: 'info' as const
      },
      {
        pattern: /\bcatch\s*\(\s*\)\s*\{/g,
        message: 'Empty catch block may swallow exceptions',
        severity: 'warning' as const
      },
      {
        pattern: /setInterval\s*\([^,]+\)/g,
        message: 'setInterval missing second argument',
        severity: 'error' as const
      }
    ],
    
    // CSS patterns
    css: [
      {
        pattern: /!important/g,
        message: 'Avoid using !important',
        severity: 'warning' as const
      },
      {
        pattern: /@import\s+url/g,
        message: 'Prefer using bundler imports over CSS @import',
        severity: 'info' as const
      },
      {
        pattern: /position:\s*absolute/g,
        message: 'Absolute positioning can lead to layout issues',
        severity: 'info' as const
      }
    ],
    
    // HTML patterns
    html: [
      {
        pattern: /<img[^>]+(?!alt=)[^>]*>/g,
        message: 'Image missing alt attribute',
        severity: 'warning' as const
      },
      {
        pattern: /<button[^>]*>(?!.*<\/button>)/g,
        message: 'Unclosed button tag',
        severity: 'error' as const
      },
      {
        pattern: /<a[^>]*>(?!.*<\/a>)/g,
        message: 'Unclosed anchor tag',
        severity: 'error' as const
      }
    ]
  };
  
  /**
   * Lint code and return issues
   */
  lintCode(code: string, language: string): LintResult {
    // Handle different language categories
    let patterns;
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'jsx':
      case 'tsx':
        patterns = this.patterns.javascript;
        break;
      case 'css':
      case 'scss':
      case 'less':
        patterns = this.patterns.css;
        break;
      case 'html':
        patterns = this.patterns.html;
        break;
      default:
        patterns = this.patterns.javascript;
    }
    
    const issues: LintIssue[] = [];
    
    // Run basic pattern matching
    patterns.forEach(({ pattern, message, severity }) => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        // Calculate line and column from match position
        const textBeforeMatch = code.substring(0, match.index);
        const lines = textBeforeMatch.split('\n');
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        
        issues.push({
          line,
          column,
          message,
          severity,
          source: match[0]
        });
      }
    });
    
    // Run syntax validation (very basic)
    try {
      if (['javascript', 'jsx', 'typescript', 'tsx'].includes(language)) {
        // Attempt to parse as JavaScript/TypeScript
        new Function(code);
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        // Try to extract line and column from error message
        const match = error.message.match(/(?:line\s+(\d+)(?:\s+column\s+(\d+))?)/i);
        const line = match && match[1] ? parseInt(match[1], 10) : 1;
        const column = match && match[2] ? parseInt(match[2], 10) : 1;
        
        issues.push({
          line,
          column,
          message: `Syntax error: ${error.message}`,
          severity: 'error'
        });
      }
    }
    
    // Count issues by severity
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    const infoCount = issues.filter(i => i.severity === 'info').length;
    
    return {
      issues,
      errorCount,
      warningCount,
      infoCount
    };
  }
  
  /**
   * Hook to use linting in React components
   */
  useLinting(code: string, language: string) {
    const [lintResults, setLintResults] = useState<LintResult>({
      issues: [],
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    });
    
    useEffect(() => {
      // Debounce linting to avoid excessive computations
      const timer = setTimeout(() => {
        const results = this.lintCode(code, language);
        setLintResults(results);
      }, 500);
      
      return () => clearTimeout(timer);
    }, [code, language]);
    
    return lintResults;
  }
}

export default new LinterService();