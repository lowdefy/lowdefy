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

function selectWatchedPluginPackages({ configDirectory, customTypesMap }) {
  const watched = [];
  for (const packageName of collectServerSidePackages(customTypesMap ?? {})) {
    const dir = resolveLocalPluginDir({ configDirectory, packageName });
    if (dir !== null) {
      watched.push({ package: packageName, dir });
    }
  }
  return watched;
}

export default selectWatchedPluginPackages;
