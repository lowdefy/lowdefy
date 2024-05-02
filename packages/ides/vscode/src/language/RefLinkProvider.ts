import * as vscode from 'vscode';

export class RefLinkProvider implements vscode.DocumentLinkProvider {
  private context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }

  public async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentLink[] | undefined> {
    const text = document.getText();
    const regexRef = /\s*(_ref|path):\s+(\S+)\n/g;
    let links: vscode.DocumentLink[] = [];
    let match;
    const activeAppRoot: vscode.Uri | undefined = this.context.workspaceState.get('activeAppRoot');
    if (!activeAppRoot) {
      return links;
    }
    while ((match = regexRef.exec(text)) !== null) {
      const filePath = match[2];
      const start = document.positionAt(match.index + match[0].indexOf(filePath));
      const end = start.translate(0, filePath.length);
      const range = new vscode.Range(start, end);

      const uri = vscode.Uri.joinPath(activeAppRoot, filePath);
      links.push(new vscode.DocumentLink(range, uri));
    }
    return links;
  }
}
