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
import { createRequire } from 'node:module';

// Extract all string literals from JS source that could be Tailwind class candidates.
// We read the raw JS text — no AST parsing needed. Tailwind's scanner does the same:
// it treats every word-like token as a potential class candidate.
function readJsFiles(distDir) {
  const content = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (/\.(js|jsx|ts|tsx|mjs)$/.test(entry.name)) {
        content.push(fs.readFileSync(fullPath, 'utf8'));
      }
    }
  }
  if (fs.existsSync(distDir)) {
    walk(distDir);
  }
  return content.join('\n');
}

function collectBlockSourceContent({ components, serverDirectory }) {
  // Resolve packages from the server directory, not from @lowdefy/build's own location.
  // In production, @lowdefy/build is installed inside .lowdefy/server/node_modules/.
  // With pnpm, import.meta.url resolves to the .pnpm store where only @lowdefy/build's
  // own declared deps are visible. Block packages are deps of the server, not of
  // @lowdefy/build, so require.resolve from import.meta.url silently fails.
  // Rooting at the server's package.json ensures block packages are always reachable.
  const requireFromServer = createRequire(
    path.join(serverDirectory, 'package.json')
  );

  const packages = [
    ...new Set((components.imports?.blocks ?? []).map((b) => b.package)),
  ];

  const allContent = [];

  for (const packageName of packages) {
    try {
      // Resolve the package entry to find its real location on disk.
      // This follows pnpm symlinks, yarn PnP, npm hoisting — any install strategy.
      const entryPath = requireFromServer.resolve(`${packageName}/blocks`);
      const distDir = path.dirname(entryPath);
      allContent.push(readJsFiles(distDir));
    } catch {
      // Package not resolvable from server context (e.g., custom plugin not installed) — skip.
    }
  }

  return allContent.join('\n');
}

export default collectBlockSourceContent;
