import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { cyberOutput } from '../../utils/output';

export function formatTypeScriptCode(code: string): string {
  const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ES2020,
    // ... other compiler options
  };

  const formatOptions: ts.FormatCodeSettings = {
    indentSize: 2,
    tabSize: 2,
    newLineCharacter: "\n",
    convertTabsToSpaces: true,
    indentStyle: ts.IndentStyle.Smart,

    // Spacing
    insertSpaceAfterCommaDelimiter: true,
    insertSpaceAfterSemicolonInForStatements: true,
    insertSpaceBeforeAndAfterBinaryOperators: true,
    insertSpaceAfterKeywordsInControlFlowStatements: true, // -> "if ( ... )"
    insertSpaceAfterFunctionKeywordForAnonymousFunctions: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis: false,
    insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces: true,

    // Brace placement
    placeOpenBraceOnNewLineForControlBlocks: false, // -> "{"
    placeOpenBraceOnNewLineForFunctions: false,

  };

  const sourceFile = ts.createSourceFile(
    "temp.ts",
    code,
    ts.ScriptTarget.ES2020,
    true
  );

  // Create a language service host and use the proper API
  const servicesHost: ts.LanguageServiceHost = {
    getScriptFileNames: () => ["temp.ts"],
    getScriptVersion: () => "0",
    getScriptSnapshot: (fileName) => {
      if (fileName === "temp.ts") {
        return ts.ScriptSnapshot.fromString(code);
      }
      return undefined;
    },
    getCurrentDirectory: () => "",
    getCompilationSettings: () => compilerOptions,
    getDefaultLibFileName: () => "",
    fileExists: () => true,
    readFile: () => code,
    readDirectory: () => [],
  };

  const languageService = ts.createLanguageService(servicesHost);
  const textChanges = languageService.getFormattingEditsForDocument(
    "temp.ts",
    formatOptions
  );

  // Apply the text changes to the original code
  let formattedCode = code;
  for (let i = textChanges.length - 1; i >= 0; i--) {
    const change = textChanges[i];
    formattedCode =
      formattedCode.substring(0, change.span.start) +
      change.newText +
      formattedCode.substring(change.span.start + change.span.length);
  }
  return formattedCode;
}

/**
 * Writes code to file with automatic TypeScript formatting
 *
 * @param filePath - Path to the file to write
 * @param content - Code content to write
 * @param encoding - File encoding (default: 'utf-8')
 * @param options - Additional options
 */
export function writeCodeToFile(
  filePath: string,
  content: string,
  encoding: BufferEncoding = 'utf-8',
  options: {
    format?: boolean;
    ensureDirectory?: boolean;
  } = {}
): void {
  const {
    format = true,
    ensureDirectory = true
  } = options;

  try {
    // Ensure directory exists if requested
    if (ensureDirectory) {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Format TypeScript code if this is a .ts file and formatting is enabled
    let finalContent = content;
    if (format && filePath.endsWith('.ts')) {
      try {
        finalContent = formatTypeScriptCode(content);
      } catch (formatError) {
        // If formatting fails, use the original content
        cyberOutput.warning(`Could not format ${filePath}, using original content`);
        finalContent = content;
      }
    }

    fs.writeFileSync(filePath, finalContent, encoding);
  } catch (error) {
    cyberOutput.error(`Error writing file ${filePath}: ${error}`);
    throw new Error(`Failed to write file: ${filePath}`);
  }
}