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

function isJourneyFile(fileName) {
  return fileName.endsWith('.yaml') || fileName.endsWith('.yml');
}

function listJourneyFiles(directory) {
  return fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return listJourneyFiles(entryPath);
      }
      return isJourneyFile(entry.name) ? [entryPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function isInside({ directory, filePath }) {
  const relative = path.relative(directory, filePath);
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
}

// The journey files the paths name, resolved against `base`: a file as it is,
// a directory as every journey file under it. Any path under the config
// directory runs, candidates in tests/journeys/_candidates included; a path
// outside it, or one that does not exist, is refused.
function resolveJourneyPaths({ paths, base, configDirectory }) {
  const files = [];
  for (const given of paths) {
    const resolved = path.resolve(base, given);
    if (!isInside({ directory: path.resolve(configDirectory), filePath: resolved })) {
      return {
        error: `Journey path "${given}" is outside the config directory ${configDirectory}.`,
      };
    }
    if (!fs.existsSync(resolved)) {
      return { error: `Journey path "${given}" does not exist.` };
    }
    if (fs.statSync(resolved).isDirectory()) {
      files.push(...listJourneyFiles(resolved));
    } else {
      files.push(resolved);
    }
  }
  return { files: [...new Set(files)] };
}

export default resolveJourneyPaths;
