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

import fs from 'fs';
import path from 'path';
import { get, type } from '@lowdefy/helpers';

// Only these kinds are loaded by the server process and cached in its ESM
// module cache. blocks, actions and operators.client are bundled by Vite,
// which rebuilds and hot-reloads them itself.
const serverSideKinds = [
  'agents',
  'connections',
  'notifications',
  'operators.server',
  'requests',
  'websockets',
  'auth.adapters',
  'auth.providers',
  'auth.strategies',
];

function collectServerSidePackages(customTypesMap) {
  const packages = new Set();
  for (const kind of serverSideKinds) {
    const store = get(customTypesMap, kind, { default: {} });
    for (const definition of Object.values(store ?? {})) {
      // A file plugin has `package: null` - there is no package directory to
      // watch. Its own file watcher lands with the path emitter.
      if (type.isString(definition?.package)) {
        packages.add(definition.package);
      }
    }
  }
  return [...packages];
}

function resolveLocalPluginDir({ configDirectory, packageName }) {
  const linked = path.join(configDirectory, 'node_modules', packageName);
  if (!fs.existsSync(linked)) {
    return null;
  }
  const realPath = fs.realpathSync(linked);
  // A published package lives inside node_modules and cannot change under a
  // running dev server; only linked local plugins resolve outside it.
  if (realPath.split(path.sep).includes('node_modules')) {
    return null;
  }
  return realPath;
}

// The first string in the package's own entry declaration - `exports['.']`
// (a string, or the first string in its condition object) or `main`.
function findEntry(value) {
  if (type.isString(value)) {
    return value;
  }
  if (!type.isObject(value)) {
    return null;
  }
  for (const nested of Object.values(value)) {
    const found = findEntry(nested);
    if (found !== null) {
      return found;
    }
  }
  return null;
}

// The server imports the plugin through build/plugins/*.js, which resolves to
// the package's entry point - `dist/` for a normal package. Watching `src/`
// alone would restart the server onto the same stale `dist`, and the developer
// would verify a fix that is not running. Watch what is actually imported, and
// fall back to `src/` for a package that is its own build output.
function resolveWatchDir({ dir }) {
  const src = path.join(dir, 'src');
  let packageJson;
  try {
    packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch {
    // A linked directory with no readable package.json cannot be imported by
    // the server either; watching its sources is the best guess left.
    return src;
  }
  const entry = findEntry(packageJson.exports?.['.'] ?? packageJson.exports) ?? packageJson.main;
  if (!type.isString(entry)) {
    return src;
  }
  return path.dirname(path.resolve(dir, entry));
}

function selectWatchedPluginPackages({ configDirectory, customTypesMap }) {
  const watched = [];
  for (const packageName of collectServerSidePackages(customTypesMap ?? {})) {
    const dir = resolveLocalPluginDir({ configDirectory, packageName });
    if (dir !== null) {
      watched.push({ package: packageName, dir, watchDir: resolveWatchDir({ dir }) });
    }
  }
  return watched;
}

export default selectWatchedPluginPackages;
