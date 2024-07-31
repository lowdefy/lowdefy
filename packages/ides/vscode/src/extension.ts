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

import getLowdefyProjectRoots from './utils/getLowdefyProjectRoots';
import AppTreeViewProvider from './views/AppTreeViewProvider';
import { RefLinkProvider } from './language/RefLinkProvider';

export async function activate(context: vscode.ExtensionContext) {
  await getLowdefyProjectRoots(context);
  const refProvider = new RefLinkProvider(context);
  const selector = { language: 'yaml', scheme: 'file' };
  const disposable = vscode.languages.registerDocumentLinkProvider(selector, refProvider);

  context.subscriptions.push(disposable);
  vscode.window.registerTreeDataProvider('lowdefyAppTree', new AppTreeViewProvider(context));
}

export function deactivate() {}
