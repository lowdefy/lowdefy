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
