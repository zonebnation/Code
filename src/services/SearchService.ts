import { File } from '../types/editor';
import { FileSearchResult, SearchMatch } from '../types/editor';

export interface SearchOptions {
  matchCase: boolean;
  wholeWord: boolean;
  useRegex: boolean;
}

export interface SearchContext {
  projectId: string;
  fileTree: File[];
}

class SearchService {
  /**
   * Search for a query across all files in a project
   */
  searchFiles(
    query: string,
    options: SearchOptions,
    context: SearchContext
  ): FileSearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const results: FileSearchResult[] = [];
    const { projectId, fileTree } = context;

    // Create search pattern based on options
    let searchPattern: RegExp;
    if (options.useRegex) {
      try {
        searchPattern = new RegExp(
          query,
          options.matchCase ? 'g' : 'gi'
        );
      } catch (e) {
        // If regex is invalid, fall back to literal search
        searchPattern = this.createSearchPattern(query, options);
      }
    } else {
      searchPattern = this.createSearchPattern(query, options);
    }

    // Search through all files
    fileTree.forEach(file => {
      if (file.type === 'file' && file.content) {
        const matches = this.findMatches(file.content, searchPattern);
        
        if (matches.length > 0) {
          results.push({
            fileId: file.id,
            fileName: file.name,
            filePath: file.path,
            matches
          });
        }
      }
    });

    return results;
  }

  /**
   * Create a search pattern based on search options
   */
  private createSearchPattern(query: string, options: SearchOptions): RegExp {
    // Escape special regex characters if not using regex mode
    const escapedQuery = options.useRegex ? query : this.escapeRegExp(query);
    
    // Add word boundary assertions for whole word search
    const pattern = options.wholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
    
    // Add case insensitivity flag if matchCase is false
    const flags = options.matchCase ? 'g' : 'gi';
    
    return new RegExp(pattern, flags);
  }

  /**
   * Find all matches in a file content
   */
  private findMatches(content: string, pattern: RegExp): SearchMatch[] {
    const matches: SearchMatch[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      // Reset regex lastIndex to search from beginning of each line
      pattern.lastIndex = 0;
      
      let match;
      while ((match = pattern.exec(line)) !== null) {
        matches.push({
          lineNumber: lineIndex + 1,
          lineContent: line,
          matchStartIndex: match.index,
          matchEndIndex: match.index + match[0].length,
          matchText: match[0],
        });
      }
    });
    
    return matches;
  }

  /**
   * Helper function to escape special regex characters
   */
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

export default new SearchService();