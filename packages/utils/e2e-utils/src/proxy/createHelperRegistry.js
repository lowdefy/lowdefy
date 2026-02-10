/*
  Copyright 2020-2024 Lowdefy, Inc

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
  const cache = new Map();

  // Create require function that resolves from the server's node_modules
  // This allows e2e helpers to be imported from packages installed in .lowdefy/server
  const serverRequire = createRequire(path.join(serverDir, 'package.json'));

  return {
    async get(helperPath) {
      if (!cache.has(helperPath)) {
        try {
          // Use serverRequire to resolve from server's node_modules
          const resolvedPath = serverRequire.resolve(helperPath);
          const module = await import(resolvedPath);
          cache.set(helperPath, module.default ?? module);
        } catch (e) {
          cache.set(helperPath, null);
        }
      }
      return cache.get(helperPath);
    },

    has(helperPath) {
      return cache.has(helperPath);
    },

    clear() {
      cache.clear();
    },
  };
}

export default createHelperRegistry;
