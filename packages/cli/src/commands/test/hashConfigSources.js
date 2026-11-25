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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Folders that hold no app config: the build and its servers, installs, git, and the journeys,
// whose own hash (hashJourney) keys a record.
const SKIPPED = new Set(['.lowdefy', 'node_modules', '.git']);

function listFiles({ directory, configDirectory, files }) {
  fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (
        SKIPPED.has(entry.name) ||
        entryPath === path.join(configDirectory, 'tests', 'journeys')
      ) {
        return;
      }
      listFiles({ directory: entryPath, configDirectory, files });
      return;
    }
    if (entry.isFile()) {
      const { size, mtimeMs } = fs.statSync(entryPath);
      files.push(`${path.relative(configDirectory, entryPath)}\t${size}\t${mtimeMs}`);
    }
  });
}

// Identifies the app's config source as a dev server run starts: every file under the config
// directory, by path, size and modified time, outside the folders above. The dev server builds a
// page only when a journey opens it, so its build hash (hashBuild) misses an edit to a page no
// journey of the run opened, such as the page of a journey a headless run lists without running
// it (rememberedBrowserOnly): this hash moves on any edit. Null when the directory cannot be read,
// which no record ever matches.
function hashConfigSources({ configDirectory }) {
  try {
    const files = [];
    listFiles({ directory: configDirectory, configDirectory, files });
    files.sort();
    return crypto.createHash('sha1').update(files.join('\n')).digest('hex');
  } catch {
    return null;
  }
}

export default hashConfigSources;
