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
import { createRequire } from 'node:module';
import path from 'node:path';

// Resolve from the server directory so installed plugins (including local
// workspace: packages) resolve exactly as the server imports them.
const require = createRequire(path.join(process.cwd(), 'package.json'));

const cache = new Map();

function resolvePluginDir({ packageName }) {
  if (cache.has(packageName)) {
    return cache.get(packageName);
  }
  let dir = null;
  // Installed plugins are direct deps of the server, so node_modules holds a
  // link to each. Plugin exports maps rarely expose ./package.json, so
  // require.resolve on it fails — check the directory first.
  const linked = path.join(process.cwd(), 'node_modules', packageName);
  if (fs.existsSync(path.join(linked, 'package.json'))) {
    dir = fs.realpathSync(linked);
  } else {
    try {
      dir = path.dirname(require.resolve(`${packageName}/package.json`));
    } catch {
      // Package not resolvable — degrade gracefully.
    }
  }
  cache.set(packageName, dir);
  return dir;
}

export default resolvePluginDir;
