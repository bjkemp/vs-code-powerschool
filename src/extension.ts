import * as vscode from 'vscode';

// Define a diagnostic collection to hold our SQL errors
const sqlDiagnostics = vscode.languages.createDiagnosticCollection('sql');

// Define the regex to match tlist_sql tags and extract the SQL code
const regex = /~\[tlist_sql;([\s\S]*?)\]\s*(.*?)\s*\[\/tlist_sql\]/gm;

class TListContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): vscode.ProviderResult<string> {
    // Fetch the contents of the TList file and return them as a string
    return "";
  }
}

async function validateSQL(sql: string): Promise<vscode.Diagnostic[]> {
  const diagnostics: vscode.Diagnostic[] = [];

  // Create a diagnostic collection for our custom SQL language
  const sqlDiagnostics = vscode.languages.createDiagnosticCollection('tlist_sql');

  // Create a new SQL document to hold the SQL code to be validated
  const doc = await vscode.workspace.openTextDocument({ language: 'sql', content: sql });

  // Retrieve the diagnostics for the SQL document
  const newDiagnostics = await vscode.languages.getDiagnostics(doc.uri);

  // Add the new diagnostics to the diagnostic collection
  sqlDiagnostics.set(doc.uri, newDiagnostics);

  // Get the diagnostics for all open SQL documents
  const allDiagnostics = await vscode.languages.getDiagnostics(doc.uri);

  // Add the diagnostics for all open SQL documents to the diagnostics array
  allDiagnostics.forEach((diagnostic) => {
    diagnostics.push(diagnostic);
  });

  return diagnostics;
}



// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Register a TextDocumentContentProvider for the "tlist" scheme
  const provider = new TListContentProvider();
  context.subscriptions.push(
    vscode.workspace.registerTextDocumentContentProvider('tlist_sql', provider)
  );


  // Register a document change listener to check for SQL errors in the tlist_sql tag
  vscode.workspace.onDidChangeTextDocument((e) => {
    const text = e.document.getText();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const sql = match[1];
      const result = match[2];
      console.log(sql);
      console.log(result);
      // Validate the SQL code using an existing SQL linter or parser library
      const errors = validateSQL(sql);
      // Convert the errors to diagnostics and add them to the diagnostic collection
      const diagnostics = errors.map((err) => {
        if (match) {
          const start = new vscode.Position(match.index + err.line, err.column);
          const end = new vscode.Position(match.index + err.line, result.split('\n')[err.line].length);
          const range = new vscode.Range(start, end);
          return new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
        } else {
          return undefined;
        }
      });
      sqlDiagnostics.set(e.document.uri, diagnostics.filter(diag => diag !== undefined) as vscode.Diagnostic[]);
    }
  });

}

// This method is called when your extension is deactivated
export function deactivate() {}