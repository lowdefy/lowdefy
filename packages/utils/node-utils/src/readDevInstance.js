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
import isPidAlive from './isPidAlive.js';

function readRecord(instancePath) {
  try {
    return JSON.parse(fs.readFileSync(instancePath, 'utf8'));
  } catch {
    // No record, or one mid-write - either way no live instance to report.
    return null;
  }
}

// A record is live only when it was written for this exact directory and its
// process still runs. The directory check matters because .lowdefy/ gets
// copied between git worktrees - a copied record names the source checkout
// and must not make this checkout look occupied.
function readDevInstance({ configDirectory }) {
  const record = readRecord(getDevInstancePath({ configDirectory }));
  if (record === null) {
    return null;
  }
  let realConfigDirectory;
  try {
    realConfigDirectory = fs.realpathSync(configDirectory);
  } catch {
    return null;
  }
  if (record.configDirectory !== realConfigDirectory || !isPidAlive(record.pid)) {
    return null;
  }
  return record;
}

export default readDevInstance;
