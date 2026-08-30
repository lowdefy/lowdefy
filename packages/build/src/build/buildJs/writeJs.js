/*
  Copyright 2020-2026 Lowdefy, Inc

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

import path from 'path';

import generateClientJsModule from './generateClientJsModule.js';
import generateJsFile from './generateJsFile.js';
import { serverJsPrototype } from './jsFunctionPrototypes.js';

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

// Import specifiers are relative to build/plugins/operators/, where both maps
// live. Dev imports the module in place under the config directory (Vite serves
// it through fs.allow and hot-replaces it); prod imports the copy that
// copyJsModules places at <server>/<config-root relative path>.
function importPaths({ context, modules }) {
  const mapDirectory = path.join(context.directories.build, 'plugins', 'operators');
  const result = {};
  for (const [hash, { absolutePath, exportName, relativePath }] of Object.entries(modules)) {
    const target =
      context.stage === 'prod'
        ? path.resolve(context.directories.server, relativePath)
        : absolutePath;
    let importPath = toPosix(path.relative(mapDirectory, target));
    if (!importPath.startsWith('.')) {
      importPath = `./${importPath}`;
    }
    result[hash] = { importPath, exportName };
  }
  return result;
}

async function writeJs({ context }) {
  await context.writeBuildArtifact(
    'plugins/operators/clientJsMap.js',
    generateClientJsModule(
      context.jsMap.client,
      importPaths({ context, modules: context.jsModules.client })
    )
  );
  await context.writeBuildArtifact(
    'plugins/operators/serverJsMap.js',
    generateJsFile({
      map: context.jsMap.server,
      modules: importPaths({ context, modules: context.jsModules.server }),
      functionPrototype: serverJsPrototype(),
    })
  );
  // The dev manager's jsModuleWatcher restarts the server when one of these
  // files changes — the server holds them in its ESM cache.
  const serverModulePaths = [
    ...new Set(Object.values(context.jsModules.server).map((mod) => mod.absolutePath)),
  ].sort();
  await context.writeBuildArtifact('js/serverModules.json', JSON.stringify(serverModulePaths));
}

export default writeJs;
