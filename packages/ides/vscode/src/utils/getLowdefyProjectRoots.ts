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
import fetch from 'node-fetch';

export default async function getLowdefyProjectRoots(
  context: vscode.ExtensionContext
): Promise<void> {
  const config = vscode.workspace.getConfiguration('lowdefyDeTools');
  const port = config.get<number>('localServerPort') || 3000;
  const url = `http://localhost:${port}/api/dev-tools`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Lowdefy development server not running at ${url}, please start the development server or check the port in the extension settings.`
    );
  }
  const devServerContext = await response.json();

  await Promise.all([
    context.workspaceState.update('activeAppRoot', devServerContext?.directories?.config),
  ]);
  // setContext can be used to set context keys that can be read in when clauses
  // https://code.visualstudio.com/api/references/when-clause-contexts#add-a-custom-when-clause-context
  // vscode.commands.executeCommand('setContext', 'lowdefy.appRoots', paths);
  // vscode.commands.executeCommand('setContext', 'lowdefy.activeAppRoot', paths[0]);
}
