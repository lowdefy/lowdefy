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

function scanPackages(repoRoot) {
  const packageMap = new Map();

  function scan(dir, depth) {
    if (depth > 4) return;
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      const entryPath = path.join(dir, entry.name);
      const pkgJsonPath = path.join(entryPath, 'package.json');
      if (fs.existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
          if (pkg.name && pkg.name.startsWith('@lowdefy/')) {
            packageMap.set(pkg.name, entryPath);
          }
        } catch {
          // skip invalid package.json
        }
      }
      scan(entryPath, depth + 1);
    }
  }

  scan(path.join(repoRoot, 'packages'), 0);
  return packageMap;
}

export default scanPackages;
