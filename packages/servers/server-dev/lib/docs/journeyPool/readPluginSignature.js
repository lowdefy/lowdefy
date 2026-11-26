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

function listFiles(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  return entries.flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

// The _js maps every JIT page build that adds _js rewrites (writePageJit). A thread reads both as
// they are now, on every call and page (loadDynamicJsMap, readClientJsMap), so a change to them
// needs no new thread: counted, they would retire every thread during the first run after each
// config build.
const READ_FRESH = new Set([
  path.join('operators', 'serverJsMap.js'),
  path.join('operators', 'clientJsMap.js'),
]);

// What a journey thread's server code depends on that can change while the dev server runs: the
// dev build's plugin files (build/plugins/), each by its path, size and mtime, but the _js maps. A thread imports them
// once, while the main thread's Vite module graph reloads the ones a config build rewrites in place
// (agents, steps, websockets, notifications), so the journey pool replaces a thread started on
// another signature (createJourneyPool). A change to a file the server reads at start restarts the
// whole server, and its threads with it (createServerArtifactTracker in the manager).
function readPluginSignature({ buildDirectory = path.join(process.cwd(), 'build') } = {}) {
  const pluginsDirectory = path.join(buildDirectory, 'plugins');
  return listFiles(pluginsDirectory)
    .filter((filePath) => !READ_FRESH.has(path.relative(pluginsDirectory, filePath)))
    .sort()
    .map((filePath) => {
      // A file a build removes between the listing and this read is gone from the signature.
      const stat = fs.statSync(filePath, { bigint: true, throwIfNoEntry: false });
      if (stat === undefined) return null;
      return `${path.relative(pluginsDirectory, filePath)}:${stat.size}:${stat.mtimeNs}`;
    })
    .filter((line) => line !== null)
    .join('\n');
}

export default readPluginSignature;
