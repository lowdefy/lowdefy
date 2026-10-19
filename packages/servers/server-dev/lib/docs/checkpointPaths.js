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

// Shared path/file-listing helpers for createConfigCheckpoint.js,
// listConfigCheckpoints.js and revertConfigCheckpoint.js.

const CONFIG_FILE_EXTENSIONS = ['.yaml', '.yml', '.json', '.md', '.js', '.env'];
const EXCLUDED_DIRECTORY_NAMES = ['.lowdefy', 'node_modules', '.git', 'checkpoints'];
const MAX_CHECKPOINTS = 20;
const MANIFEST_FILE_NAME = 'manifest.json';

function getConfigDirectory() {
  return process.env.LOWDEFY_DIRECTORY_CONFIG || process.cwd();
}

function getCheckpointsRoot() {
  return path.join(getConfigDirectory(), '.lowdefy', 'checkpoints');
}

// path.extname('.env') is '' (dotfiles have no extension in Node's eyes), so a
// dotfile named exactly ".env" needs its own basename check.
function isConfigFile(filePath) {
  if (path.basename(filePath) === '.env') {
    return true;
  }
  return CONFIG_FILE_EXTENSIONS.includes(path.extname(filePath));
}

// Recursively lists config-relevant files under `configDirectory`, returned as
// paths relative to it. Skips directories that should never be snapshotted —
// build output (.lowdefy, which also holds the checkpoints themselves),
// dependencies (node_modules) and version control (.git).
function listConfigFiles({ configDirectory }) {
  const results = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRECTORY_NAMES.includes(entry.name)) {
          continue;
        }
        walk(fullPath);
      } else if (entry.isFile() && isConfigFile(fullPath)) {
        results.push(path.relative(configDirectory, fullPath));
      }
    }
  }

  if (fs.existsSync(configDirectory)) {
    walk(configDirectory);
  }
  return results;
}

// Slugifies a checkpoint label for use in a directory name — lowercase,
// non-alphanumeric runs collapsed to a single "-", leading/trailing "-"
// trimmed. Falls back to "checkpoint" when the label slugifies to nothing
// (e.g. an empty string or a label made only of punctuation).
function slug(label) {
  const slugified = String(label ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slugified === '' ? 'checkpoint' : slugified;
}

export {
  getCheckpointsRoot,
  getConfigDirectory,
  listConfigFiles,
  MANIFEST_FILE_NAME,
  MAX_CHECKPOINTS,
  slug,
};
