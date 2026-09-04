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
import { type } from '@lowdefy/helpers';

import { clearMocks } from './devMockRegistry.js';
import {
  getCheckpointsRoot,
  getConfigDirectory,
  listConfigFiles,
  MANIFEST_FILE_NAME,
} from './checkpointPaths.js';

function copyFromSnapshot({ snapshotDirectory, configDirectory, relativeFilePath }) {
  const source = path.join(snapshotDirectory, relativeFilePath);
  const destination = path.join(configDirectory, relativeFilePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

// Restores the config directory to exactly the state captured by checkpoint
// `id`: every file the manifest lists is copied back (covering both
// modified files and files deleted after the checkpoint was taken), and any
// config-relevant file that exists now but isn't in the manifest is deleted
// (covering files added after the checkpoint). The manifest — not a diff
// against the live directory — is the single source of truth for what
// "restored" means, so reverts are exact and repeatable.
//
// Replayed request responses were recorded against the config as it was
// before the revert, so they are dropped here rather than left answering for
// a page whose requests may no longer be the ones that were recorded.
function revertConfigCheckpoint({ id }) {
  if (type.isNone(id) || !type.isString(id)) {
    throw new Error(
      `revertConfigCheckpoint requires an "id" string. Received ${JSON.stringify(id)}.`
    );
  }

  const checkpointsRoot = getCheckpointsRoot();
  const snapshotDirectory = path.join(checkpointsRoot, id);
  const manifestPath = path.join(snapshotDirectory, MANIFEST_FILE_NAME);
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Config checkpoint "${id}" not found.`);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const configDirectory = getConfigDirectory();

  manifest.files.forEach((relativeFilePath) => {
    copyFromSnapshot({ snapshotDirectory, configDirectory, relativeFilePath });
  });

  const manifestFiles = new Set(manifest.files);
  const currentFiles = listConfigFiles({ configDirectory });
  const deleted = currentFiles.filter((relativeFilePath) => !manifestFiles.has(relativeFilePath));
  deleted.forEach((relativeFilePath) => {
    fs.rmSync(path.join(configDirectory, relativeFilePath));
  });

  clearMocks();

  return { restored: manifest.files, deleted };
}

export default revertConfigCheckpoint;
