import { CompletionItem } from '../components/Editor/CodeCompletion';
import CodeIntelligenceService from './CodeIntelligence';

// Interface for AI-powered code completion results
export interface AICompletionResult {
  suggestions: CompletionItem[];
  isLoading: boolean;
  error: string | null;
}

class AICompletionService {
  private static instance: AICompletionService;
  private cachedCompletions: Map<string, CompletionItem[]> = new Map();
  private isGenerating = false;

  // Sample code patterns for common use cases to enhance the basic completion
  private codePatterns = {
    react: [
      {
        pattern: 'useState',
        completion: {
          label: 'useState',
          kind: 'snippet',
          insertText: 'const [${1:state}, set${1/(.*)/${1:/capitalize}/}] = useState(${2:initialState})',
          documentation: 'React useState hook for component state',
          detail: 'React Hook'
        }
      },
      {
        pattern: 'useEffect',
        completion: {
          label: 'useEffect',
          kind: 'snippet',
          insertText: 'useEffect(() => {\n\t${1}\n\treturn () => {\n\t\t${2}\n\t};\n}, [${3}])',
          documentation: 'React useEffect hook for side effects',
          detail: 'React Hook'
        }
      },
      {
        pattern: 'component',
        completion: {
          label: 'React Functional Component',
          kind: 'snippet',
          insertText: 'const ${1:ComponentName} = (${2:props}) => {\n\treturn (\n\t\t<div>\n\t\t\t${3}\n\t\t</div>\n\t);\n};\n\nexport default ${1:ComponentName};',
          documentation: 'Create a functional React component',
          detail: 'React Component'
        }
      }
    ],
    typescript: [
      {
        pattern: 'interface',
        completion: {
          label: 'interface',
          kind: 'snippet',
          insertText: 'interface ${1:InterfaceName} {\n\t${2:property}: ${3:type};\n}',
          documentation: 'TypeScript interface declaration',
          detail: 'TypeScript'
        }
      },
      {
        pattern: 'type',
        completion: {
          label: 'type',
          kind: 'snippet',
          insertText: 'type ${1:TypeName} = ${2:string};',
          documentation: 'TypeScript type alias',
          detail: 'TypeScript'
        }
      }
    ],
    javascript: [
      {
        pattern: 'function',
        completion: {
          label: 'function',
          kind: 'snippet',
          insertText: 'function ${1:functionName}(${2:params}) {\n\t${3}\n}',
          documentation: 'Function declaration',
          detail: 'JavaScript'
        }
      },
      {
        pattern: 'arrow',
        completion: {
          label: 'arrow function',
          kind: 'snippet',
          insertText: 'const ${1:functionName} = (${2:params}) => {\n\t${3}\n}',
          documentation: 'Arrow function expression',
          detail: 'JavaScript'
        }
      },
      {
        pattern: 'class',
        completion: {
          label: 'class',
          kind: 'snippet',
          insertText: 'class ${1:ClassName} {\n\tconstructor(${2:params}) {\n\t\t${3}\n\t}\n\n\t${4:methodName}() {\n\t\t${5}\n\t}\n}',
          documentation: 'Class declaration',
          detail: 'JavaScript'
        }
      }
    ]
  };

  private constructor() {}

  public static getInstance(): AICompletionService {
    if (!this.instance) {
      this.instance = new AICompletionService();
    }
    return this.instance;
  }

  /**
   * Get AI-powered code completions based on the current code and cursor position
   */
  public async getCompletions(
    code: string,
    position: number,
    language: string,
    prefix: string = '',
    debounceMs: number = 300
  ): Promise<AICompletionResult> {
    if (!code || !language) {
      return { suggestions: [], isLoading: false, error: null };
    }

    // Get basic completions from the code intelligence service
    const basicCompletions = CodeIntelligenceService.getCompletions(code, position, language, prefix);
    
    // Start with basic completions
    let enhancedCompletions = [...basicCompletions];
    
    // Immediately return cached completions if available
    const cacheKey = `${language}:${prefix}:${position}`;
    if (this.cachedCompletions.has(cacheKey)) {
      return { 
        suggestions: this.cachedCompletions.get(cacheKey) || [], 
        isLoading: false, 
        error: null 
      };
    }
    
    // If we're already generating, just return the basic completions
    if (this.isGenerating) {
      return { suggestions: enhancedCompletions, isLoading: true, error: null };
    }
    
    // Mark that we're generating suggestions
    this.isGenerating = true;
    
    try {
      // Add pattern-based AI suggestions for the language
      enhancedCompletions = this.addPatternBasedCompletions(enhancedCompletions, language, code, position, prefix);
      
      // Add context-aware AI suggestions - this would connect to an actual AI service in a real implementation
      const contextAwareSuggestions = await this.generateContextAwareSuggestions(
        code, position, language, prefix
      );
      
      // Combine all suggestions and remove duplicates
      const allCompletions = [...enhancedCompletions, ...contextAwareSuggestions];
      const uniqueCompletions = this.removeDuplicates(allCompletions);
      
      // Sort completions by relevance (simplified logic - in a real implementation this would be more sophisticated)
      const sortedCompletions = this.sortByRelevance(uniqueCompletions, prefix);
      
      // Cache the result
      this.cachedCompletions.set(cacheKey, sortedCompletions);
      
      return { 
        suggestions: sortedCompletions, 
        isLoading: false, 
        error: null 
      };
    } catch (error) {
      console.error('Error generating AI completions:', error);
      return { 
        suggestions: enhancedCompletions, 
        isLoading: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Add pattern-based completions for the current language
   */
  private addPatternBasedCompletions(
    completions: CompletionItem[],
    language: string,
    code: string,
    position: number,
    prefix: string
  ): CompletionItem[] {
    // Map our language to pattern languages
    const patternLanguage = this.mapLanguageToPatternLanguage(language);
    
    // Get patterns for the language
    const patterns = this.codePatterns[patternLanguage as keyof typeof this.codePatterns] || [];
    
    // Add pattern-based completions that match the prefix
    for (const pattern of patterns) {
      if (pattern.pattern.toLowerCase().includes(prefix.toLowerCase())) {
        // Check if this completion is already in the list
        const exists = completions.some(comp => comp.label === pattern.completion.label);
        if (!exists) {
          completions.push(pattern.completion);
        }
      }
    }
    
    return completions;
  }

  /**
   * Map editor language to pattern language
   */
  private mapLanguageToPatternLanguage(language: string): string {
    if (['jsx', 'tsx'].includes(language)) {
      return 'react';
    }
    if (language === 'typescript' || language === 'tsx') {
      return 'typescript';
    }
    return 'javascript';
  }

  /**
   * Generate context-aware suggestions based on the surrounding code
   * In a real implementation, this would call an AI service
   */
  private async generateContextAwareSuggestions(
    code: string,
    position: number,
    language: string,
    prefix: string
  ): Promise<CompletionItem[]> {
    // This is a simplified mock implementation
    // In a real system, this would call an AI service API
    
    // Extract context from code (current line, surrounding lines)
    const contextLines = this.extractContextLines(code, position);
    
    // In a real implementation, we'd send this context to an AI service
    // For now, we'll just simulate a delay and return some intelligent-looking completions
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
    
    // Generate mock AI completions based on context
    const aiCompletions: CompletionItem[] = [];
    
    // Check for common patterns in the context
    if (contextLines.includes('function') || contextLines.includes('const') || contextLines.includes('let')) {
      // Looks like we're in a function definition or variable declaration
      aiCompletions.push({
        label: `${prefix}Function`,
        kind: 'function',
        insertText: `${prefix}Function(${contextLines.includes('async') ? 'async' : ''}) {\n  // Implementation\n}`,
        documentation: 'AI-suggested function based on your code context',
        detail: 'AI Suggestion'
      });
    }
    
    if (contextLines.includes('class') || contextLines.includes('extends')) {
      // Looks like we're in a class definition
      aiCompletions.push({
        label: `${prefix}Method`,
        kind: 'method',
        insertText: `${prefix}Method() {\n  // Implementation\n}`,
        documentation: 'AI-suggested class method based on your code context',
        detail: 'AI Suggestion'
      });
    }
    
    if (contextLines.includes('component') || contextLines.includes('React') || 
        contextLines.includes('<div') || contextLines.includes('props')) {
      // Looks like React code
      aiCompletions.push({
        label: `${prefix}Component`,
        kind: 'class',
        insertText: `function ${prefix}Component({ ${contextLines.includes('props') ? 'props' : ''} }) {\n  return (\n    <div>\n      {/* Content */}\n    </div>\n  );\n}`,
        documentation: 'AI-suggested React component based on your code context',
        detail: 'AI Suggestion'
      });
    }
    
    // Add some generic suggestions
    aiCompletions.push({
      label: `${prefix}Suggestion`,
      kind: 'variable',
      insertText: prefix,
      documentation: 'AI-suggested completion',
      detail: 'AI Suggestion'
    });
    
    return aiCompletions;
  }

  /**
   * Extract context lines around the current cursor position
   */
  private extractContextLines(code: string, position: number, contextSize: number = 5): string {
    const lines = code.split('\n');
    let lineNumber = 0;
    let charCount = 0;
    
    // Find the current line number
    for (let i = 0; i < lines.length; i++) {
      charCount += lines[i].length + 1; // +1 for newline
      if (charCount > position) {
        lineNumber = i;
        break;
      }
    }
    
    // Extract context lines
    const startLine = Math.max(0, lineNumber - contextSize);
    const endLine = Math.min(lines.length - 1, lineNumber + contextSize);
    
    return lines.slice(startLine, endLine + 1).join('\n');
  }

  /**
   * Remove duplicate completions
   */
  private removeDuplicates(completions: CompletionItem[]): CompletionItem[] {
    const seen = new Set<string>();
    return completions.filter(item => {
      const key = item.label;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Sort completions by relevance to the prefix
   */
  private sortByRelevance(completions: CompletionItem[], prefix: string): CompletionItem[] {
    return completions.sort((a, b) => {
      // Exact match with prefix comes first
      const aStartsWithPrefix = a.label.toLowerCase().startsWith(prefix.toLowerCase());
      const bStartsWithPrefix = b.label.toLowerCase().startsWith(prefix.toLowerCase());
      
      if (aStartsWithPrefix && !bStartsWithPrefix) return -1;
      if (!aStartsWithPrefix && bStartsWithPrefix) return 1;
      
      // AI suggestions come before regular ones when prefix is matched
      const aIsAI = a.detail?.includes('AI');
      const bIsAI = b.detail?.includes('AI');
      
      if (aStartsWithPrefix && bStartsWithPrefix) {
        if (aIsAI && !bIsAI) return -1;
        if (!aIsAI && bIsAI) return 1;
      }
      
      // Shorter completions come first
      return a.label.length - b.label.length;
    });
  }

  /**
   * Clear the completion cache
   */
  public clearCache(): void {
    this.cachedCompletions.clear();
  }
}

export default AICompletionService.getInstance();