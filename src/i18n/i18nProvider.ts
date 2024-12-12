import * as vscode from 'vscode';
import * as path from 'path';

interface TranslationEntry {
    key: string;
    value: string;
    file: string;
    line: number;
}

export class I18nProvider implements vscode.HoverProvider, vscode.CompletionItemProvider, vscode.DefinitionProvider {
    private translations: Map<string, Map<string, TranslationEntry>> = new Map();
    private diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('powerschool-i18n');
        void this.loadTranslations();
        
        // Watch for changes in translation files
        const watcher = vscode.workspace.createFileSystemWatcher('**/MessageKeys/*.properties');
        watcher.onDidChange(() => void this.loadTranslations());
        watcher.onDidCreate(() => void this.loadTranslations());
        watcher.onDidDelete(() => void this.loadTranslations());
    }

    private async loadTranslations(): Promise<void> {
        this.translations.clear();
        const config = vscode.workspace.getConfiguration('powerschoolI18n');
        const messageKeysPath = config.get<string>('messageKeysPath') || 'src/powerschool/MessageKeys';
        
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return;
        }

        const fullPath = path.join(workspaceFolders[0].uri.fsPath, messageKeysPath);
        const files = await vscode.workspace.findFiles(new vscode.RelativePattern(fullPath, '*.properties'));

        for (const file of files) {
            const locale = path.basename(file.fsPath).split('.')[1]; // Extract locale from filename
            const content = await vscode.workspace.fs.readFile(file);
            const lines = Buffer.from(content).toString('utf8').split('\n');
            
            if (!this.translations.has(locale)) {
                this.translations.set(locale, new Map());
            }

            const localeMap = this.translations.get(locale)!;
            
            lines.forEach((line, index) => {
                if (line.trim() && !line.startsWith('#')) {
                    const [key, value] = line.split('=').map(s => s.trim());
                    if (key && value) {
                        localeMap.set(key, {
                            key,
                            value,
                            file: file.fsPath,
                            line: index
                        });
                    }
                }
            });
        }

        this.updateDiagnostics();
    }

    private updateDiagnostics(): void {
        this.diagnosticCollection.clear();
        const diagnostics = new Map<string, vscode.Diagnostic[]>();

        // Compare translations across locales
        const locales = Array.from(this.translations.keys());
        const baseLocale = locales.find(l => l.endsWith('en')) || locales[0];
        if (!baseLocale) {
            return;
        }

        const baseTranslations = this.translations.get(baseLocale)!;
        
        for (const locale of locales) {
            if (locale === baseLocale) {
                continue;
            }
            
            const localeTranslations = this.translations.get(locale)!;
            const missingKeys = Array.from(baseTranslations.keys())
                .filter(key => !localeTranslations.has(key));

            if (missingKeys.length > 0) {
                const diagnostic = new vscode.Diagnostic(
                    new vscode.Range(0, 0, 0, 0),
                    `Missing translations for keys: ${missingKeys.join(', ')}`,
                    vscode.DiagnosticSeverity.Warning
                );
                
                const localeFile = vscode.Uri.file(path.join(
                    vscode.workspace.workspaceFolders![0].uri.fsPath,
                    'src/powerschool/MessageKeys',
                    `${path.basename(baseLocale, '.properties')}.${locale}.properties`
                ));
                
                const fileDiagnostics = diagnostics.get(localeFile.fsPath) || [];
                fileDiagnostics.push(diagnostic);
                diagnostics.set(localeFile.fsPath, fileDiagnostics);
            }
        }

        for (const [file, diags] of diagnostics) {
            this.diagnosticCollection.set(vscode.Uri.file(file), diags);
        }
    }

    provideHover(_document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.Hover | undefined {
        const wordRange = _document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = _document.getText(wordRange);
        const translations: string[] = [];

        for (const [locale, localeMap] of this.translations) {
            const translation = localeMap.get(word);
            if (translation) {
                translations.push(`**${locale}**: ${translation.value}`);
            }
        }

        if (translations.length > 0) {
            return new vscode.Hover(translations);
        }

        return undefined;
    }

    provideCompletionItems(_document: vscode.TextDocument, _position: vscode.Position, _token: vscode.CancellationToken): vscode.CompletionItem[] {
        const items: vscode.CompletionItem[] = [];
        const baseLocale = Array.from(this.translations.keys()).find(l => l.endsWith('en'));
        if (!baseLocale) {
            return items;
        }

        const baseTranslations = this.translations.get(baseLocale)!;
        for (const [key, translation] of baseTranslations) {
            const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Text);
            item.detail = translation.value;
            item.documentation = new vscode.MarkdownString(
                Array.from(this.translations.entries())
                    .map(([locale, map]) => `**${locale}**: ${map.get(key)?.value || 'Missing'}`)
                    .join('\n\n')
            );
            items.push(item);
        }

        return items;
    }

    provideDefinition(_document: vscode.TextDocument, position: vscode.Position, _token: vscode.CancellationToken): vscode.Definition | undefined {
        const wordRange = _document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return undefined;
        }

        const word = _document.getText(wordRange);
        const definitions: vscode.Location[] = [];

        for (const localeMap of this.translations.values()) {
            const translation = localeMap.get(word);
            if (translation) {
                definitions.push(new vscode.Location(
                    vscode.Uri.file(translation.file),
                    new vscode.Position(translation.line, 0)
                ));
            }
        }

        return definitions.length > 0 ? definitions : undefined;
    }
}
