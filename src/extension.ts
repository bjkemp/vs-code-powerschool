import * as vscode from 'vscode';
import { TlistLinter } from './tlistLinter';

// Define a diagnostic collection to hold our SQL errors
const sqlDiagnostics = vscode.languages.createDiagnosticCollection('sql');

// Define the regex to match tlist_sql tags and extract the SQL code
const regex = /~\[tlist_sql;([\s\S]*?)\]\s*(.*?)\s*\[\/tlist_sql\]/gm;

// Get the active editor
const editor = vscode.window.activeTextEditor;


function tlistSqlDiagnostics(range: vscode.Range, document: vscode.TextDocument): void {
  // const diagnostics = vscode.languages.getDiagnostics();
  // console.log(diagnostics)
  
  // const diagnosticCollection = vscode.languages.createDiagnosticCollection();
  // for(let diagnostic of diagnostics) {
  //   diagnostic.message = 'foo'    
  //   if(diagnostic.range.intersection(range)) {
  //     console.log(diagnostic)
  //     // vscode.languages.(document.uri, [
  //     //   {
  //     //     range: diagnostic.range,
  //     //     text: ''
  //     //   }
  //     // ])
  //   }
  // }

  // const diagnostics = vscode.languages.createDiagnosticCollection('tlist_sql');
  // const tlistErrors = [];

  for (let i = range.start.line; i <= range.end.line; i++) {
    const line = editor?.document.lineAt(i);
    const lineText = line?.text;
    // tlistErrors.push({ message: `Syntax error at line ${i}`, line: i })
    // console.log(`Line ${i}: ${lineText}`);
  }

  // const diagnosticArray: vscode.Diagnostic[] = tlistErrors.map(error => {
  //   const range = new vscode.Range(error.line - 1, 0, error.line - 1, Number.MAX_VALUE);
  //   const diagnostic = new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
  //   diagnostic.source = 'tlist_sql';
  //   return diagnostic;
  // });

  // diagnostics.set(document.uri, diagnosticArray);
}

function validateDocument(document: vscode.TextDocument): void {
  const text = document.getText();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    const range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + match[0].length));
    // console.log(`Range: ${range.start.line} - ${range.end.line}`)
    tlistSqlDiagnostics(range, document);
    // if (editor) {
    //   const diagnosticCollection = vscode.languages.createDiagnosticCollection();
    //   const diagnostics = diagnosticCollection.get(editor.document.uri);
    //   console.log(diagnostics)
    // }

    // const sql = match[1];

    // // Clear any existing diagnostics for this document
    // sqlDiagnostics.set(document.uri, []);

    // parseSqlString(sql,document);
    // // Validate the SQL code using an existing SQL linter or parser library
    // validateSQL(sql, document).then((errors) => {
    //   // Convert the errors to diagnostics and add them to the diagnostic collection
    //   const diagnostics = errors.map((err) => {
    //     const start = new vscode.Position(err.range.start.line, err.range.start.character);
    //     const end = new vscode.Position(err.range.end.line, err.range.end.character);
    //     const range = new vscode.Range(start, end);
    //     return new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
    //   });
    //   sqlDiagnostics.set(document.uri, diagnostics);
    // });
  }
}

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
  const tlistLinter = new TlistLinter();
  const provider = vscode.languages.registerCodeActionsProvider(
    { pattern: '**/*.sql', scheme: 'file' }, // Adjust this to match the files you want to lint
    tlistLinter,
    { providedCodeActionKinds: TlistLinter.providedCodeActionKinds }
  );
  context.subscriptions.push(provider);

  // // Register this function to be called when a document is opened or changed
  // context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => validateDocument(event.document)));
  // context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(document => validateDocument(document)));
  // // Validate the SQL code in all open documents on activation
  // vscode.workspace.textDocuments.forEach(validateDocument);
}

// This method is called when your extension is deactivated
export function deactivate() {}

// async function validateSQL(sql: string, doc: vscode.TextDocument): Promise<vscode.Diagnostic[]> {
//   const diagnostics: vscode.Diagnostic[] = [];

//   if(sql.trim() !== '') {
//     console.log(`SQL: ${sql}`)
//     console.dir(sqlDiagnostics)
//     console.log(`SQL Document: ${doc.uri}`)

//     // Retrieve the diagnostics for the SQL document
//     const newDiagnostics = await vscode.languages.getDiagnostics(doc.uri);

//     // Add the new diagnostics to the diagnostic collection
//     sqlDiagnostics.set(doc.uri, newDiagnostics);

//     // Get the diagnostics for all open SQL documents
//     const allDiagnostics = await vscode.languages.getDiagnostics(doc.uri);
//     console.log(`Diagnostics: ${allDiagnostics.length}`)

//     // Add the diagnostics for all open SQL documents to the diagnostics array
//     allDiagnostics.forEach((diagnostic) => {
//       console.log(`Diagnostic: ${diagnostic.message}`)
//       diagnostics.push(diagnostic);
//     });
//   }

//   return diagnostics;
// }

// async function lintSql(sqlString: string): Promise<vscode.Diagnostic[]> {
//   // Create an empty array to hold any errors found by sql-lint
//   const errors: vscode.Diagnostic[] = [];

//   // sqlLint({sql: sqlString}).then((errors) => {
//   //   console.log(`SQL: ${sqlString} Errors: ${errors}`)
//   // })

//   // Use sql-lint to lint the SQL string
//   // const results = await lint({sql: sqlString});
//   // console.log(`Result: ${results}`)

//   // // Loop through the results and add any errors to the errors array
//   // results?.forEach(result => {
//   //   // const error = new vscode.Diagnostic(
//   //   //   new vscode.Range(
//   //   //     result.lineNumber - 1, // sql-lint uses 1-based line numbers, so subtract 1
//   //   //     result.columnNumber - 1, // sql-lint uses 1-based column numbers, so subtract 1
//   //   //     result.lineNumber - 1,
//   //   //     result.columnNumber - 1
//   //   //   ),
//   //   //   result.message,
//   //   //   vscode.DiagnosticSeverity.Error
//   //   // );

//   //   // errors.push(error);
//   // });

//   // Return the array of errors
//   return errors;
// }

// export function parseSqlString(sqlString: string, document: vscode.TextDocument): void {
//   const diagnostics = vscode.languages.createDiagnosticCollection('sql');
//   console.log(`ParseSQL: ${sqlString}`)

//   // Replace this with your own SQL parsing logic
//   // This is just a placeholder example
//   const sqlErrors = [
//     { message: "Syntax error at line 1", line: 1 },
//     { message: "Unknown column 'foo' in table 'bar'", line: 4 },
//   ];

//   const textRange = new vscode.Range(0, 0, document.lineCount, 0);

//   const diagnosticArray: vscode.Diagnostic[] = sqlErrors.map(error => {
//     const range = new vscode.Range(error.line - 1, 0, error.line - 1, Number.MAX_VALUE);
//     const diagnostic = new vscode.Diagnostic(range, error.message, vscode.DiagnosticSeverity.Error);
//     diagnostic.source = 'sql';
//     return diagnostic;
//   });

//   diagnostics.set(document.uri, diagnosticArray);
// }
