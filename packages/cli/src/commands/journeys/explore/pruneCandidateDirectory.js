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

import explorerCandidatesDirectory from './explorerCandidatesDirectory.js';
import { isCandidateFolderUnedited } from './writeCandidateManifest.js';

// The age pruneExploreDirectory keeps .lowdefy/explore/<run>/ for.
const RETENTION_MS = 14 * 24 * 60 * 60 * 1000;

// Keeps tests/journeys/_candidates/explorer/ bounded: a run's candidate folder
// older than 14 days is removed at the start of a run, unless a file in it is
// not as the run wrote it (isCandidateFolderUnedited): a candidate a person
// edited is never deleted. Returns { pruned, keptEdited }, each a list of
// folders relative to the config directory.
async function pruneCandidateDirectory({ configDirectory, now = Date.now() }) {
  const directory = explorerCandidatesDirectory({ configDirectory });
  const cutoff = now - RETENTION_MS;
  const pruned = [];
  const keptEdited = [];
  let entries = [];
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  for (const entry of entries.filter((item) => item.isDirectory())) {
    const runDirectory = path.join(directory, entry.name);
    const { mtimeMs } = await fs.promises.stat(runDirectory);
    if (mtimeMs >= cutoff) continue;
    const relative = path.relative(configDirectory, runDirectory).split(path.sep).join('/');
    if (isCandidateFolderUnedited({ directory: runDirectory })) {
      await fs.promises.rm(runDirectory, { recursive: true, force: true });
      pruned.push(relative);
    } else {
      keptEdited.push(relative);
    }
  }
  return { pruned, keptEdited };
}

export default pruneCandidateDirectory;
