import * as vscode from 'vscode';
import { parse as sqlParse } from 'sql-parser';

export class TlistLinter implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  public provideCodeActions(
    document: vscode.TextDocument,
    _range: vscode.Range
  ): vscode.CodeAction[] | undefined {
    const text = document.getText();
    const actions: vscode.CodeAction[] = [];

    // Find TLIST_SQL tags
    const regex = /~\[tlist_sql;([\s\S]*?)\]\s*(.*?)\s*\[\/tlist_sql\]/gm;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const sql = match[1];
      try {
        sqlParse(sql);
      } catch (error) {
        if (error instanceof Error) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);

          const action = new vscode.CodeAction(
            'Fix SQL syntax',
            vscode.CodeActionKind.QuickFix
          );
          action.edit = new vscode.WorkspaceEdit();
          action.edit.replace(
            document.uri,
            range,
            `~[tlist_sql;SELECT * FROM table WHERE id = 1] [/tlist_sql]`
          );
          action.isPreferred = true;

          actions.push(action);
        }
      }
    }

    return actions;
  }
}