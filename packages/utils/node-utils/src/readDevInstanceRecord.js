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

import getDevInstancePath from './getDevInstancePath.js';

function readRecord(instancePath) {
  try {
    return JSON.parse(fs.readFileSync(instancePath, 'utf8'));
  } catch {
    // No record, or one mid-write - either way no live instance to report.
    return null;
  }
}

// The app's dev instance record, when it was written for this exact directory;
// whether its process still runs is the caller's to check. The directory check
// matters because .lowdefy/ gets copied between git worktrees - a copied record
// names the source checkout and must not make this checkout look occupied.
function readDevInstanceRecord({ configDirectory }) {
  const record = readRecord(getDevInstancePath({ configDirectory }));
  if (record === null) {
    return null;
  }
  let realConfigDirectory;
  try {
    // The path as stored on disk, as the manager records it, so a case
    // variant of the directory (macOS) still finds its record.
    realConfigDirectory = fs.realpathSync.native(configDirectory);
  } catch {
    return null;
  }
  if (record.configDirectory !== realConfigDirectory) {
    return null;
  }
  return record;
}

export default readDevInstanceRecord;
