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

import connectionSchemaCache from './connectionSchemaCache.js';
import resolveConnectionPackage from './resolveConnectionPackage.js';
import runConnectionSchemaWorker from './runConnectionSchemaWorker.js';

function cacheKey({ packageName, version, directory }) {
  return `${packageName}@${version}:${directory}`;
}

// Collects the schemas of the connection packages, per package name:
// { connections: { [type]: { schema, requests } }, requests: { [type]: { schema, meta } } },
// or null when the package does not resolve. The packages are imported in a
// worker thread, so their database drivers never load into this process (the
// dev manager runs this build in-process, for the whole session). Installed
// packages are cached by name, version and directory; when every package is
// cached, no worker starts.
async function collectConnectionSchemas({ context, packageNames }) {
  const collected = {};
  const keys = {};
  const toCollect = [];
  for (const packageName of packageNames) {
    const resolved = resolveConnectionPackage({ context, packageName });
    if (resolved?.cacheable) {
      const key = cacheKey({ packageName, ...resolved });
      if (connectionSchemaCache.has(key)) {
        collected[packageName] = connectionSchemaCache.get(key);
        continue;
      }
      keys[packageName] = key;
    }
    toCollect.push(packageName);
  }
  if (toCollect.length === 0) {
    return collected;
  }
  const fresh = await runConnectionSchemaWorker({
    packageNames: toCollect,
    serverDirectory: context.directories?.server,
  });
  for (const packageName of toCollect) {
    collected[packageName] = fresh[packageName];
    if (keys[packageName]) {
      connectionSchemaCache.set(keys[packageName], fresh[packageName]);
    }
  }
  return collected;
}

export default collectConnectionSchemas;
