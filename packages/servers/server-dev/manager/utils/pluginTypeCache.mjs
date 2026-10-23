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

import fs from 'node:fs';
import path from 'node:path';
import importFresh from './importFresh.mjs';

// Each importFresh starts a worker thread (about 50 ms a plugin), and every
// skeleton rebuild reads every plugin's /types and /messages. The manager
// keeps each import here, keyed by the plugin package directory's realpath
// (pnpm gives changed contents a new store path), the entry file's mtimeNs and
// size, and the package.json version. The key can not see the files an entry
// re-exports, such as a local plugin's block list, so the watchers that can
// change a plugin's types (plugin source, restart request, .env, root
// lowdefy.yaml) clear the cache before they build. A failed import is never
// kept.
const cache = new Map();

function readPackage(directory) {
  try {
    return JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8'));
  } catch {
    return null;
  }
}

// The package directory is the nearest one up from the entry file whose
// package.json has the plugin's name: a build output folder may have its own
// package.json, such as { "type": "module" }.
function findPackage({ entryPath, packageName }) {
  let nearest = null;
  let directory = path.dirname(entryPath);
  let parent = path.dirname(directory);
  while (directory !== parent) {
    const packageJson = readPackage(directory);
    if (packageJson) {
      nearest = nearest ?? { directory, packageJson };
      if (packageJson.name === packageName) {
        return { directory, packageJson };
      }
    }
    directory = parent;
    parent = path.dirname(directory);
  }
  return nearest;
}

function readCacheKey({ entryPath, packageName }) {
  const stat = fs.statSync(entryPath, { bigint: true });
  const found = findPackage({ entryPath, packageName });
  return JSON.stringify([
    found ? fs.realpathSync(found.directory) : null,
    stat.mtimeNs.toString(),
    stat.size.toString(),
    found?.packageJson.version ?? null,
  ]);
}

// Resolves to what importFresh(entryPath) resolves to. Each caller gets its own
// copy, so a caller that changes the value can not change the cached one.
async function importPluginModule({ entryPath, packageName }) {
  let key;
  try {
    key = readCacheKey({ entryPath, packageName });
  } catch {
    // The entry can not be read, so the import reports why.
    cache.delete(entryPath);
    return importFresh(entryPath);
  }
  let entry = cache.get(entryPath);
  if (!entry || entry.key !== key) {
    entry = { key, value: importFresh(entryPath) };
    cache.set(entryPath, entry);
    entry.value.catch(() => {
      if (cache.get(entryPath) === entry) {
        cache.delete(entryPath);
      }
    });
  }
  return structuredClone(await entry.value);
}

function clearPluginTypeCache() {
  cache.clear();
}

export { clearPluginTypeCache, importPluginModule };
