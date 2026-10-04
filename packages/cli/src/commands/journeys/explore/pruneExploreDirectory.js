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

const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;
// Run directories are named by run id; trees and builds are caches.
const CACHE_DIRECTORIES = ['trees', 'builds'];

async function removeOlderThan({ directory, cutoff }) {
  let entries;
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const removed = [];
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const entryPath = path.join(directory, entry.name);
    const { mtimeMs } = await fs.promises.stat(entryPath);
    if (mtimeMs < cutoff) {
      await fs.promises.rm(entryPath, { recursive: true, force: true });
      removed.push(entryPath);
    }
  }
  return removed;
}

// Keeps .lowdefy/explore/ bounded: run directories older than 14 days, and
// base trees and builds not used for 14 days, are removed at the start of a
// run. A cached tree or build is touched when a run reuses it.
async function pruneExploreDirectory({ exploreDirectory, now = Date.now() }) {
  const cutoff = now - RETENTION_MS;
  const removed = [];
  let entries = [];
  try {
    entries = await fs.promises.readdir(exploreDirectory, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const entryPath = path.join(exploreDirectory, entry.name);
    if (CACHE_DIRECTORIES.includes(entry.name)) {
      removed.push(...(await removeOlderThan({ directory: entryPath, cutoff })));
      continue;
    }
    const { mtimeMs } = await fs.promises.stat(entryPath);
    if (mtimeMs < cutoff) {
      await fs.promises.rm(entryPath, { recursive: true, force: true });
      removed.push(entryPath);
    }
  }
  return removed;
}

export default pruneExploreDirectory;
