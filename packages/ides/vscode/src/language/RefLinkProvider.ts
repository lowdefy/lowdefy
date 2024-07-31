/*
  Copyright 2020-2024 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

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
    let links: vscode.DocumentLink[] = [];
    const activeAppRoot = this.context.workspaceState.get<string>('activeAppRoot');
    const activeAppRootUri = vscode.Uri.file(activeAppRoot || '');
    if (!activeAppRootUri.path) {
      console.error('Active App Root path is not defined or invalid.');
      return links; // Exit if no valid URI path
    }

    const text = document.getText();
    let match;
    const regexRef = /[  -]*(_ref|path):\s+(\S+)\n/gm;
    while ((match = regexRef.exec(text)) !== null) {
      const filePath = match[2];
      const start = document.positionAt(match.index + match[0].indexOf(filePath));
      const end = start.translate(0, filePath.length);
      const range = new vscode.Range(start, end);
      try {
        const uri = vscode.Uri.joinPath(activeAppRootUri, filePath);
        links.push(new vscode.DocumentLink(range, uri));
      } catch (err) {
        console.error(
          `failed to define file path uri: ${filePath} activeAppRoot: ${activeAppRoot}`,
          err
        );
        continue;
      }
    }
    return links;
  }
}
