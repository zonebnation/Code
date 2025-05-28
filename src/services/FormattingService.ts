export const formatCode = (code: string, language: string): string => {
  try {
    // Simple formatting - replace tabs with spaces and add proper indentation
    const lines = code.split('\n');
    const formattedLines = [];
    let indentLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      
      // Adjust indent level based on braces
      if (line.includes('}') && !line.includes('{') && indentLevel > 0) {
        indentLevel--;
      }
      
      // Add proper indentation
      if (line.length > 0) {
        line = '  '.repeat(indentLevel) + line;
      }
      
      formattedLines.push(line);
      
      // Adjust indent level for next line
      if (line.includes('{') && !line.includes('}')) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  } catch (error) {
    console.error('Error formatting code:', error);
    return code; // Return original code if formatting fails
  }
};

export default formatCode;