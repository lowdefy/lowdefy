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

import resolvePath from './resolvePath.js';

const MAX_FILE_SIZE = 512 * 1024; // 512KB

async function readFile(basePath, { path: filePath }) {
  const resolved = resolvePath(basePath, filePath);
  const stats = await fs.stat(resolved);
  if (stats.size <= MAX_FILE_SIZE) {
    return await fs.readFile(resolved, 'utf-8');
  }
  const handle = await fs.open(resolved, 'r');
  try {
    const buffer = Buffer.alloc(MAX_FILE_SIZE);
    await handle.read(buffer, 0, MAX_FILE_SIZE, 0);
    const content = buffer.toString('utf-8');
    const shownKB = Math.round(MAX_FILE_SIZE / 1024);
    const totalKB = Math.round(stats.size / 1024);
    return `${content}\n\n[File truncated — showing first ${shownKB}KB of ${totalKB}KB. Use search-files to find specific content.]`;
  } finally {
    await handle.close();
  }
}

export default readFile;
