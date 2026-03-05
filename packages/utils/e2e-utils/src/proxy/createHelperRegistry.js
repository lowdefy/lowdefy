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

import { createRequire } from 'module';
import path from 'path';

function createHelperRegistry({ serverDir }) {
  const moduleCache = new Map();

  // Create require function that resolves from the server's node_modules
  // This allows e2e helpers to be imported from packages installed in .lowdefy/server
  const serverRequire = createRequire(path.join(serverDir, 'package.json'));

  async function getModule(helperPath) {
    if (!moduleCache.has(helperPath)) {
      try {
        const resolvedPath = serverRequire.resolve(helperPath);
        const module = await import(resolvedPath);
        moduleCache.set(helperPath, module);
      } catch (e) {
        moduleCache.set(helperPath, null);
      }
    }
    return moduleCache.get(helperPath);
  }

  return {
    async get(helperPath, blockType) {
      const module = await getModule(helperPath);
      if (!module) return null;
      return module[blockType] ?? module.default ?? null;
    },

    has(helperPath) {
      return moduleCache.has(helperPath);
    },

    clear() {
      moduleCache.clear();
    },
  };
}

export default createHelperRegistry;
