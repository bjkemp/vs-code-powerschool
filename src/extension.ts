import * as vscode from 'vscode';
import { TlistLinter } from './tlistLinter';
import { parseDefaultPropertiesFiles } from './propertiesParser';
import { I18nProvider } from './i18n/i18nProvider';
import { parse as sqlParse } from 'sql-parser';

// Create diagnostic collection for SQL errors
const SQL_DIAGNOSTICS = vscode.languages.createDiagnosticCollection('tlist-sql');

// TLIST_SQL tag regex with named capture groups
const TLIST_SQL_REGEX = /~\[tlist_sql;(?<sql>[\s\S]*?)\]\s*(?<content>.*?)\s*\[\/tlist_sql\]/gm;

class TlistSqlValidator {
  private static validateSql(sql: string): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    try {
      sqlParse(sql);
    } catch (error) {
      if (error instanceof Error) {
        diagnostics.push(new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, sql.length),
          `SQL Error: ${error.message}`,
          vscode.DiagnosticSeverity.Error
        ));
      }
    }
    return diagnostics;
  }

  public static validateDocument(document: vscode.TextDocument): void {
    const text = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    let match: RegExpExecArray | null;
    while ((match = TLIST_SQL_REGEX.exec(text)) !== null && match.groups) {
      const { sql } = match.groups;
      const sqlStartOffset = match[0].indexOf(sql);
      const startPos = document.positionAt(match.index + sqlStartOffset);
      const endPos = document.positionAt(match.index + sqlStartOffset + sql.length);

      const sqlDiagnostics = this.validateSql(sql).map(d => 
        new vscode.Diagnostic(
          new vscode.Range(startPos, endPos),
          d.message,
          d.severity
        )
      );

      diagnostics.push(...sqlDiagnostics);
    }

    SQL_DIAGNOSTICS.set(document.uri, diagnostics);
  }
}

export function activate(context: vscode.ExtensionContext): void {
  console.log('PowerSchool extension activated');

  // Register TLIST_SQL linter
  const tlistLinter = new TlistLinter();
  context.subscriptions.push(
    vscode.languages.registerCodeActionsProvider(
      { pattern: '**/*.{html,jsp}', scheme: 'file' },
      tlistLinter,
      { providedCodeActionKinds: TlistLinter.providedCodeActionKinds }
    )
  );

  // Initialize and register i18n provider
  const i18nProvider = new I18nProvider();
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(['html', 'javascript'], i18nProvider),
    vscode.languages.registerDefinitionProvider(['html', 'javascript'], i18nProvider),
    vscode.languages.registerCompletionItemProvider(['html', 'javascript'], i18nProvider, '.', '~')
  );

  // Register document validators
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.languageId === 'html' || e.document.languageId === 'jsp') {
        TlistSqlValidator.validateDocument(e.document);
      }
    }),
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc.languageId === 'html' || doc.languageId === 'jsp') {
        TlistSqlValidator.validateDocument(doc);
      }
    }),
    SQL_DIAGNOSTICS
  );

  // Load initial properties files
  void parseDefaultPropertiesFiles();
}

export function deactivate(): void {
  SQL_DIAGNOSTICS.clear();
  SQL_DIAGNOSTICS.dispose();
}
