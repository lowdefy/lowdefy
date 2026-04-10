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

import resolvePath from '../resolvePath.js';
import schema from './schema.js';

async function FileSystemList({ connection, request }) {
  const absoluteBase = path.resolve(connection.basePath);
  const dirPath = resolvePath(connection.basePath, request.path);

  if (request.glob) {
    const matches = await glob(request.glob, {
      cwd: dirPath,
      dot: true,
    });
    const results = [];
    for (const match of matches.sort()) {
      const absoluteMatch = path.resolve(dirPath, match);
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

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const results = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absoluteEntry = path.join(dirPath, entry.name);
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

FileSystemList.schema = schema;
FileSystemList.meta = {
  checkRead: true,
  checkWrite: false,
};

export default FileSystemList;
