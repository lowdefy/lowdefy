const fs = require('node:fs');
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

function findWorkspaceRoot(directory) {
  if (fs.existsSync(path.join(directory, 'pnpm-workspace.yaml'))) {
    return directory;
  }
  const parent = path.dirname(directory);
  return parent === directory ? null : findWorkspaceRoot(parent);
}

const config = getDefaultConfig(projectRoot);
config.resolver.unstable_enableSymlinks = true;

// Lowdefy packages shared with the server import a few Node built-ins in code the client never
// runs (@lowdefy/errors reads build maps with `path`). The web client's bundler leaves them empty
// in the browser; Metro does the same here.
const SERVER_ONLY_BUILTINS = new Set(['path']);
const resolveDefault = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (SERVER_ONLY_BUILTINS.has(moduleName)) {
    return { type: 'empty' };
  }
  return (resolveDefault ?? context.resolveRequest)(context, moduleName, platform);
};

// In a pnpm workspace (the Lowdefy monorepo) the shell's Lowdefy packages are symlinks to their
// workspace folders: Metro watches the whole workspace and resolves from the shell's own
// node_modules before the workspace root's.
const workspaceRoot = findWorkspaceRoot(path.dirname(projectRoot));
if (workspaceRoot !== null) {
  config.watchFolders = [workspaceRoot];
  config.resolver.nodeModulesPaths = [
    path.join(projectRoot, 'node_modules'),
    path.join(workspaceRoot, 'node_modules'),
  ];
}

module.exports = config;
