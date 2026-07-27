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

// The build rewrites the operator JS maps when a JIT page discovers new _js
// operators, so the map imported at startup goes stale as soon as a page is
// built. Re-read the artifact whenever its mtime changes and merge it over the
// statically imported base. Used for both the server map (the api context) and
// the client map (report rendering, which evaluates client operators).
function createJsMapLoader({ artifact, staticJsMap }) {
  let cachedMtime = null;
  let cachedJsMap = staticJsMap;

  return function loadJsMap(buildDirectory) {
    const jsMapPath = path.join(buildDirectory, 'plugins', 'operators', artifact);
    try {
      const stat = fs.statSync(jsMapPath);
      if (cachedMtime && stat.mtimeMs === cachedMtime) {
        return cachedJsMap;
      }
      cachedMtime = stat.mtimeMs;
      // For server-side, we can read and eval the JS file
      const content = fs.readFileSync(jsMapPath, 'utf8');
      const fn = new Function('exports', content.replace('export default', 'exports.default ='));
      const exports = {};
      fn(exports);
      cachedJsMap = { ...staticJsMap, ...(exports.default ?? {}) };
      return cachedJsMap;
    } catch {
      return cachedJsMap;
    }
  };
}

export default createJsMapLoader;
