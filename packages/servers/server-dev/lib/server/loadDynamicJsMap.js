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

import staticJsMap from '../../build/plugins/operators/serverJsMap.js';

// Dynamic JS map loading for JIT-built pages — the build rewrites
// serverJsMap.js when a JIT page discovers new _js operators. The file carries
// import statements for _js module references, so it is loaded as a real
// module (a fresh specifier per mtime defeats the ESM cache) rather than
// evaluated as text.
let cachedJsMapMtime = null;
let cachedJsMap = staticJsMap;
let pending = null;

async function loadDynamicJsMap(buildDirectory) {
  const jsMapPath = path.join(buildDirectory, 'plugins', 'operators', 'serverJsMap.js');
  let stat;
  try {
    stat = fs.statSync(jsMapPath);
  } catch {
    return cachedJsMap;
  }
  if (cachedJsMapMtime === stat.mtimeMs) {
    return pending ?? cachedJsMap;
  }
  cachedJsMapMtime = stat.mtimeMs;
  pending = import(/* @vite-ignore */ `${jsMapPath}?v=${stat.mtimeMs}`)
    .then((mod) => {
      cachedJsMap = { ...staticJsMap, ...(mod.default ?? {}) };
      return cachedJsMap;
    })
    .catch(() => cachedJsMap)
    .finally(() => {
      pending = null;
    });
  return pending;
}

// Synchronous readers (auth hook system contexts) take the most recent map;
// every page and API request refreshes it through loadDynamicJsMap first.
export function peekDynamicJsMap() {
  return cachedJsMap;
}

export default loadDynamicJsMap;
