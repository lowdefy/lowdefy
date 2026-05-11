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

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

import resolvePath from './resolvePath.js';

async function listFiles(basePath, { path: dirPath, glob: globPattern } = {}) {
  const absoluteBase = path.resolve(basePath);
  const resolved = resolvePath(basePath, dirPath);

  if (globPattern) {
    const matches = await glob(globPattern, { cwd: resolved, dot: true });
    const safeMatches = matches.filter((match) => {
      const abs = path.resolve(resolved, match);
      return abs === absoluteBase || abs.startsWith(absoluteBase + path.sep);
    });
    const results = [];
    for (const match of safeMatches.sort()) {
      const absoluteMatch = path.resolve(resolved, match);
      const relativePath = path.relative(absoluteBase, absoluteMatch);
      const stats = await fs.stat(absoluteMatch);
      results.push({
        name: path.basename(match),
        path: relativePath,
        type: stats.isDirectory() ? 'directory' : 'file',
        size: stats.size,
      });
    }
    return results;
  }

  const entries = await fs.readdir(resolved, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absoluteEntry = path.join(resolved, entry.name);
    const relativePath = path.relative(absoluteBase, absoluteEntry);
    const stats = await fs.stat(absoluteEntry);
    results.push({
      name: entry.name,
      path: relativePath,
      type: entry.isDirectory() ? 'directory' : 'file',
      size: stats.size,
    });
  }
  return results;
}

export default listFiles;
