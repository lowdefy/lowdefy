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
import { type } from '@lowdefy/helpers';

import getDevInstancePath from './getDevInstancePath.js';
import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';

function readRecord(instancePath) {
  try {
    return JSON.parse(fs.readFileSync(instancePath, 'utf8'));
  } catch {
    // No record, or one mid-write - either way no live instance to report.
    return null;
  }
}

// Readers poll the record (every 100 ms while waiting on a build), and a
// start time costs a ps process, so it is read once a few seconds per pid.
const START_TIME_TTL_MS = 5000;
const startTimes = new Map();

function readStartTime(pid) {
  const cached = startTimes.get(pid);
  if (!type.isUndefined(cached) && Date.now() - cached.readAt < START_TIME_TTL_MS) {
    return cached.startTime;
  }
  const now = Date.now();
  startTimes.forEach((entry, key) => {
    if (now - entry.readAt >= START_TIME_TTL_MS) {
      startTimes.delete(key);
    }
  });
  const startTime = getProcessStartTime({ pid });
  startTimes.set(pid, { startTime, readAt: now });
  return startTime;
}

// A pid alone does not name a process: after a crash (kill -9 skips the
// manager's cleanup) or a reboot, the record's pid can belong to something
// else. The manager records its start time too. A record from a manager that
// predates it, or a start time ps could not read, leaves the pid to decide -
// never "not running", which would let a second dev server start beside it.
function isRecordProcess(record) {
  if (!isPidAlive(record.pid)) {
    return false;
  }
  if (type.isNone(record.processStartTime)) {
    return true;
  }
  const startTime = readStartTime(record.pid);
  return type.isNone(startTime) || startTime === record.processStartTime;
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
    // The path as stored on disk, as the manager records it, so a case
    // variant of the directory (macOS) still finds its record.
    realConfigDirectory = fs.realpathSync.native(configDirectory);
  } catch {
    return null;
  }
  if (record.configDirectory !== realConfigDirectory || !isRecordProcess(record)) {
    return null;
  }
  return record;
}

export default readDevInstance;
