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

import { getCheckpointsRoot, MANIFEST_FILE_NAME } from './checkpointPaths.js';

// Lists stored config checkpoints, most recent first. Reads manifest.json
// from each snapshot directory rather than re-scanning the config
// directory — the manifest is the source of truth for what a checkpoint
// contains, and stays accurate even after later checkpoints or reverts.
function listConfigCheckpoints() {
  const checkpointsRoot = getCheckpointsRoot();
  if (!fs.existsSync(checkpointsRoot)) {
    return [];
  }

  const checkpoints = fs
    .readdirSync(checkpointsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const manifestPath = path.join(checkpointsRoot, entry.name, MANIFEST_FILE_NAME);
      if (!fs.existsSync(manifestPath)) {
        // A checkpoint directory without a manifest is not one this module
        // wrote (or was interrupted mid-write) — skip rather than guess.
        return null;
      }
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return {
        id: manifest.id,
        label: manifest.label,
        createdAt: manifest.createdAt,
        fileCount: manifest.files.length,
      };
    })
    .filter((checkpoint) => checkpoint !== null);

  return checkpoints.sort((a, b) => (a.id < b.id ? 1 : -1));
}

export default listConfigCheckpoints;
