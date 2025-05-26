import prettier from "prettier/standalone";
import babelParser from "prettier/parser-babel";
import typescriptParser from "prettier/parser-typescript";

export const formatCode = (code: string, language: string): string => {
  try {
    const formattedCode = prettier.format(code, {
      parser: language === 'typescript' || language === 'tsx' ? 'typescript' : 'babel',
      plugins: [babelParser, typescriptParser],
      semi: true,
      singleQuote: true,
      tabWidth: 2,
    });
    return formattedCode;
  } catch (error) {
    console.error('Error formatting code:', error);
    return code; // Return original code if formatting fails
  }
};

export default formatCode