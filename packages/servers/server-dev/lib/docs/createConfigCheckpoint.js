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

import {
  getCheckpointsRoot,
  getConfigDirectory,
  listConfigFiles,
  MANIFEST_FILE_NAME,
  MAX_CHECKPOINTS,
  slug,
} from './checkpointPaths.js';

// Checkpoint ids sort chronologically as plain strings (ISO timestamp
// prefix), which is what listConfigCheckpoints and the checkpoint cap rely
// on — ":" and "." are replaced since they're awkward/unsafe in directory
// names on some filesystems.
function buildCheckpointId(label) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${timestamp}-${slug(label)}`;
}

function copyIntoSnapshot({ configDirectory, snapshotDirectory, relativeFilePath }) {
  const source = path.join(configDirectory, relativeFilePath);
  const destination = path.join(snapshotDirectory, relativeFilePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

// Deletes the oldest checkpoints once the stored count exceeds MAX_CHECKPOINTS.
// Checkpoint directory names sort chronologically, so a plain string sort
// puts the oldest first.
function enforceCheckpointCap({ checkpointsRoot }) {
  const ids = fs
    .readdirSync(checkpointsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const excessCount = ids.length - MAX_CHECKPOINTS;
  if (excessCount <= 0) {
    return;
  }
  ids.slice(0, excessCount).forEach((id) => {
    fs.rmSync(path.join(checkpointsRoot, id), { recursive: true, force: true });
  });
}

// Snapshots every config-relevant file in the config directory into
// <configDir>/.lowdefy/checkpoints/<id>/, alongside a manifest.json listing
// the files it holds — revertConfigCheckpoint uses that manifest to restore
// exactly, including deleting files that didn't exist at checkpoint time.
function createConfigCheckpoint({ label }) {
  const configDirectory = getConfigDirectory();
  const checkpointsRoot = getCheckpointsRoot();
  const id = buildCheckpointId(label);
  const snapshotDirectory = path.join(checkpointsRoot, id);

  const files = listConfigFiles({ configDirectory });

  fs.mkdirSync(snapshotDirectory, { recursive: true });
  files.forEach((relativeFilePath) => {
    copyIntoSnapshot({ configDirectory, snapshotDirectory, relativeFilePath });
  });

  const createdAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(snapshotDirectory, MANIFEST_FILE_NAME),
    JSON.stringify({ id, label: label ?? null, createdAt, files }, null, 2)
  );

  enforceCheckpointCap({ checkpointsRoot });

  return { id, fileCount: files.length };
}

export default createConfigCheckpoint;
