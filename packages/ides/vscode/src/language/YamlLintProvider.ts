import * as vscode from 'vscode';
import * as yaml from 'js-yaml';

export class YamlLintProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor(private context: vscode.ExtensionContext) {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('lowdefy-yaml');
    this.registerListeners();
  }

  private registerListeners(): void {
    this.context.subscriptions.push(this.diagnosticCollection);
    this.context.subscriptions.push(
      vscode.workspace.onDidOpenTextDocument(this.lintYamlDocument, this)
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidChangeTextDocument((event) => this.lintYamlDocument(event.document))
    );
    this.context.subscriptions.push(
      vscode.workspace.onDidSaveTextDocument(this.lintYamlDocument, this)
    );
  }

  private lintYamlDocument(textDocument: vscode.TextDocument): void {
    if (textDocument.languageId !== 'lowdefy-yaml') return;

    const diagnostics: vscode.Diagnostic[] = [];
    try {
      yaml.loadAll(textDocument.getText());
    } catch (e: any) {
      const diagnostic: vscode.Diagnostic = this.createDiagnosticFromError(e, textDocument);
      diagnostics.push(diagnostic);
    }

    this.diagnosticCollection.set(textDocument.uri, diagnostics);
  }

  private createDiagnosticFromError(
    error: yaml.YAMLException,
    textDocument: vscode.TextDocument
  ): vscode.Diagnostic {
    const line = error.mark.line;
    const character = error.mark.column;
    const range = new vscode.Range(line, character, line, character + 3);
    const message = error.message;

    const diagnostic = new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error);
    return diagnostic;
  }
}
