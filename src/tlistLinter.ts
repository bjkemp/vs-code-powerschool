import * as vscode from 'vscode';
import sqlLint from 'sql-lint';

export class TlistLinter implements vscode.CodeActionProvider {


  async provideCodeActions(document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext, token: vscode.CancellationToken): Promise<(vscode.Command | vscode.CodeAction)[]> {
    const code = document.getText(range);
    const sqlCode = this.extractSqlCode(code);
    console.log(sqlCode);
    const errors: any[] = [];
    // const errors = await sqlLint(sqlCode);
    return this.createCodeActions(errors, document, range);
  }

  private extractSqlCode(code: string): string {
    const match = code.match(/~\[tlist_sql\](.*?)\[\/tlist_sql\]/s);
    return match ? match[1].trim() : "";
  }

  private createCodeActions(errors: any[], document: vscode.TextDocument, range: vscode.Range): vscode.CodeAction[] {
    return errors.map((error: any) => {
      const fix = new vscode.CodeAction(`Fix: ${error.message}`, vscode.CodeActionKind.QuickFix);
      fix.edit = new vscode.WorkspaceEdit();
      // Here we replace the problematic code with an empty string, you might want to replace it with a proper fix
      fix.edit.replace(document.uri, range, '');
      return fix;
    });
  }

  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];
}