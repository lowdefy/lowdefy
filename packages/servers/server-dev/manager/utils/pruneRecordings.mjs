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

// Only what the dev server records. traces/production/ is the production
// mining cache, pruned by its own command on its own schedule.
const PRUNED_SOURCES = ['dev', 'journey', 'explorer'];
const DATE_DIRECTORY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function listDateDirectories({ tracesDirectory }) {
  return PRUNED_SOURCES.flatMap((source) => {
    const sourceDirectory = path.join(tracesDirectory, source);
    if (!fs.existsSync(sourceDirectory)) return [];
    return fs
      .readdirSync(sourceDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && DATE_DIRECTORY_PATTERN.test(entry.name))
      .map((entry) => ({ date: entry.name, path: path.join(sourceDirectory, entry.name) }));
  });
}

function listTraceFiles({ dateDirectories }) {
  return dateDirectories.flatMap((directory) =>
    fs
      .readdirSync(directory.path, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
      .map((entry) => {
        const filePath = path.join(directory.path, entry.name);
        const stat = fs.statSync(filePath);
        return { path: filePath, size: stat.size, mtimeMs: stat.mtimeMs };
      })
  );
}

// Recordings are kept 7 days or 200 MB, whichever is smaller. Date
// directories older than maxAgeDays go first, then the oldest files by mtime
// until the rest fit, never the newest file (the tab recording right now).
function pruneRecordings({
  configDirectory,
  now = Date.now(),
  maxAgeDays = 7,
  maxBytes = 200 * 1024 * 1024,
}) {
  const tracesDirectory = path.join(configDirectory, '.lowdefy', 'traces');
  const cutoff = new Date(now - maxAgeDays * DAY_MS).toISOString().slice(0, 10);
  const deleted = { directories: [], files: [] };

  const dateDirectories = listDateDirectories({ tracesDirectory });
  const kept = [];
  dateDirectories.forEach((directory) => {
    if (directory.date < cutoff) {
      fs.rmSync(directory.path, { recursive: true, force: true });
      deleted.directories.push(directory.path);
      return;
    }
    kept.push(directory);
  });

  const files = listTraceFiles({ dateDirectories: kept }).sort((a, b) => a.mtimeMs - b.mtimeMs);
  let total = files.reduce((sum, file) => sum + file.size, 0);
  for (const file of files.slice(0, -1)) {
    if (total <= maxBytes) break;
    fs.rmSync(file.path, { force: true });
    deleted.files.push(file.path);
    total -= file.size;
  }
  return deleted;
}

export default pruneRecordings;
