import * as vscode from 'vscode';

export default async function getLowdefyProjectRoots(
  context: vscode.ExtensionContext
): Promise<void> {
  const files = await vscode.workspace.findFiles('**/lowdefy.{yaml,yml}');

  if (files.length > 0) {
    // Remove the final 'lowdefy.yaml' segment from paths to get paths to app config directories
    const paths = files.map((uri) => {
      const pathSegments = uri.path.split('/');
      pathSegments.pop();
      return uri.with({ path: pathSegments.join('/') });
    });

    await Promise.all([
      context.workspaceState.update('appRoots', paths),
      context.workspaceState.update('activeAppRoot', paths[0]),
    ]);
    // setContext can be used to set context keys that can be read in when clauses
    // https://code.visualstudio.com/api/references/when-clause-contexts#add-a-custom-when-clause-context
    // vscode.commands.executeCommand('setContext', 'lowdefy.appRoots', paths);
    // vscode.commands.executeCommand('setContext', 'lowdefy.activeAppRoot', paths[0]);
  }
}
