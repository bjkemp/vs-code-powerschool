import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

// Define a type for storing key-value pairs
interface TranslationMap {
  [key: string]: string;
}

// Default directory for .properties files
const defaultDirPath = path.join(__dirname, 'powerschool', 'MessageKeys');

/**
 * Reads and parses .properties files from the specified directory.
 * @param dirPath - The directory containing .properties files.
 * @returns A map of translation keys and values.
 */
export function parsePropertiesFiles(dirPath: string): TranslationMap {
  const translations: TranslationMap = {};

  // Read all files in the directory
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    if (path.extname(file) === '.properties') {
      const filePath = path.join(dirPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const lines = fileContent.split('\n');

      lines.forEach(line => {
        // Ignore comments and empty lines
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            translations[key.trim()] = value.trim();
          }
        }
      });
    }
  });

  return translations;
}

/**
 * Reads and parses .properties files from the default directory.
 * @returns A map of translation keys and values.
 */
export function parseDefaultPropertiesFiles(): TranslationMap {
  return parsePropertiesFiles(defaultDirPath);
}

// Function to get the path from user settings
function getMessageKeysPath(): string {
  const config = vscode.workspace.getConfiguration('powerschoolI18n');
  return config.get<string>('messageKeysPath', 'src/powerschool/MessageKeys');
}

/**
 * Reads and parses .properties files from the user-specified directory.
 * @returns A map of translation keys and values.
 */
export function parseUserDefinedPropertiesFiles(): TranslationMap {
  const dirPath = getMessageKeysPath();
  return parsePropertiesFiles(dirPath);
}
