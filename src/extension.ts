import * as vscode from 'vscode';

// Define a diagnostic collection to hold our SQL errors
const sqlDiagnostics = vscode.languages.createDiagnosticCollection('sql');

// Define the regex to match tlist_sql tags and extract the SQL code
const regex = /~\[tlist_sql;([\s\S]*?)\]\s*(.*?)\s*\[\/tlist_sql\]/gm;

function activate(context: vscode.ExtensionContext) {
  // Register a TextDocumentContentProvider for the "tlist" scheme
  const provider = new TListContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('tlist', provider)
  );

  // Register a document change listener to check for SQL errors in the tlist_sql tag
  vscode.workspace.onDidChangeTextDocument((e) => {
		console.log(e.document.uri.scheme);
    if (e.document.uri.scheme === 'tlist') {
      const text = e.document.getText();
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text))) {
        const sql = match[1];
        const code = match[2];
				console.log(sql);
				console.log(code);
        // Validate the SQL code using an existing SQL linter or parser library
        const errors = validateSQL(sql, code);
        // Convert the errors to diagnostics and add them to the diagnostic collection
        const diagnostics = errors.map((err) => {
          if (match) {
            const start = new vscode.Position(match.index + err.line, err.column);
            const end = new vscode.Position(match.index + err.line, code.split('\n')[err.line].length);
            const range = new vscode.Range(start, end);
            return new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
          } else {
            return undefined;
          }
        });
        sqlDiagnostics.set(e.document.uri, diagnostics.filter(diag => diag !== undefined) as vscode.Diagnostic[]);
      }
    }
  });
}

function validateSQL(sql: string, code: string): { line: number; column: number; message: string }[] {
  // Use an existing SQL linter or parser library to validate the SQL code
  // Return an array of error objects with properties `line`, `column`, and `message`
  return [];
}

class TListContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
    // Fetch the contents of the TList file and return them as a string
    return "";
  }
}

export function deactivate() {
  // Clear the SQL diagnostics when the extension is deactivated
  sqlDiagnostics.clear();
}
