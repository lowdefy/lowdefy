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

import schema from './schema.js';

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const MAX_TOTAL_MATCHES = 200;

async function FileSystemSearch({ connection, request }) {
  const absoluteBase = path.resolve(connection.basePath);
  const pattern = request.glob ?? '**/*';

  const files = await glob(pattern, {
    cwd: absoluteBase,
    nodir: true,
    dot: true,
    absolute: true,
  });

  const results = [];
  let totalMatches = 0;
  const queryLower = request.query.toLowerCase();

  for (const file of files.sort()) {
    if (totalMatches >= MAX_TOTAL_MATCHES) break;

    const stats = await fs.stat(file);
    if (stats.size > MAX_FILE_SIZE) continue;

    let content;
    try {
      content = await fs.readFile(file, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    const matches = [];

    for (let i = 0; i < lines.length; i++) {
      if (totalMatches >= MAX_TOTAL_MATCHES) break;
      if (lines[i].toLowerCase().includes(queryLower)) {
        matches.push({
          lineNumber: i + 1,
          line: lines[i],
          context: {
            before: i > 0 ? lines[i - 1] : null,
            after: i < lines.length - 1 ? lines[i + 1] : null,
          },
        });
        totalMatches += 1;
      }
    }

    if (matches.length > 0) {
      results.push({
        path: path.relative(absoluteBase, file),
        matches,
      });
    }
  }

  return results;
}

FileSystemSearch.schema = schema;
FileSystemSearch.meta = {
  checkRead: true,
  checkWrite: false,
};

export default FileSystemSearch;
