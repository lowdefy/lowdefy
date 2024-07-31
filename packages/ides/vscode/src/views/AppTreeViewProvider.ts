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

import ArrayTreeItem from './treeItems/ArrayTreeItem';
import TextTreeItem from './treeItems/TextTreeItem';

export default class AppTreeViewProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  constructor(private context: vscode.ExtensionContext) {}

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      return this.getRootChildren();
    }

    return Promise.resolve([]);
  }

  private async getRootChildren(): Promise<vscode.TreeItem[]> {
    const activeAppRoot: vscode.Uri | undefined = this.context.workspaceState.get('activeAppRoot');

    if (!activeAppRoot) {
      return [];
    }
    const items = [new TextTreeItem('name: Test App'), new TextTreeItem('version: 4.0.2')];

    if (
      await this.pathExists(
        vscode.Uri.joinPath(activeAppRoot, '.lowdefy', 'dev', 'build', 'connections')
      )
    ) {
      items.push(new ArrayTreeItem('connections:', vscode.TreeItemCollapsibleState.Collapsed));
    }

    if (
      await this.pathExists(vscode.Uri.joinPath(activeAppRoot, '.lowdefy', 'dev', 'build', 'pages'))
    ) {
      items.push(new ArrayTreeItem('pages:', vscode.TreeItemCollapsibleState.Collapsed));
    }

    return Promise.resolve(items);
  }

  private async pathExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
    } catch (err) {
      return false;
    }

    return true;
  }
}
