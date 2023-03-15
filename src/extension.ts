// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

enum TokenType {
	tlist_sql = 1
}

const selector: vscode.DocumentSelector = [
	{scheme: 'file', language: 'json'},
	{scheme: 'file', language: 'html'},
	{scheme: 'file', language: 'javascript'},
	{scheme: 'file', language: 'text'},
]

const provider: vscode.DocumentSemanticTokensProvider = {
	provideDocumentSemanticTokens(
  	document: vscode.TextDocument
	): vscode.ProviderResult<vscode.SemanticTokens> {
		const builder = new vscode.SemanticTokensBuilder();
		console.log(`Tokenizing document: ${document.uri}`);

		const regex = /~\[tlist_sql;([\s\S]*?)\]\s*(.*?)\s*\[\/tlist_sql\]/gm;
		let match: RegExpExecArray | null;
		while ((match = regex.exec(document.getText())) !== null) {
			console.log(`Found tlist_sql token: ${match[0]}`);
			const start = document.positionAt(match.index);
			const end = document.positionAt(match.index + match[0].length);

			builder.push(
				start.line,
				start.character,
				match[1].trim().split(/\s+/g).length, // token length
				TokenType.tlist_sql
			);

			builder.push(
				end.line,
				end.character,
				0, // token length
				0
			);
		}

		console.log(`Tokenizing completed for document: ${document.uri}`);
		return builder.build();
	}
};

const legend = new vscode.SemanticTokensLegend(
  ['tlist_sql'],
  []
);

const providerRegistration = vscode.languages.registerDocumentSemanticTokensProvider(
  selector,
  provider,
  legend
);

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	context.subscriptions.push(providerRegistration);
	console.log('[TLIST_SQL]Provider registration added to context.subscriptions:', providerRegistration);

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vs-code-powerschool" is now active!');

	// // The command has been defined in the package.json file
	// // Now provide the implementation of the command with registerCommand
	// // The commandId parameter must match the command field in package.json
	// let disposable = vscode.commands.registerCommand('vs-code-powerschool.helloWorld', () => {
	// 	// The code you place here will be executed every time your command is executed
	// 	// Display a message box to the user
	// 	vscode.window.showInformationMessage('Hello World from VS Code - PowerSchool!');
	// });

	// context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
