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

import compareProcessStartTimes from './compareProcessStartTimes.js';
import createStartTimeCache from './createStartTimeCache.js';
import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';
import isProcessStartTime from './isProcessStartTime.js';
import readDevInstanceRecord from './readDevInstanceRecord.js';

const readStartTime = createStartTimeCache({ read: getProcessStartTime });

// A pid alone does not name a process: after a crash (kill -9 skips the
// manager's cleanup) or a reboot, the record's pid can belong to something
// else. The manager records its start time too. A record from a manager that
// predates it or wrote it in another format, or a start time ps could not
// read, leaves the pid to decide - never "not running", which would let a
// second dev server start beside it.
function isRecordProcess(record) {
  if (!isPidAlive(record.pid)) {
    return false;
  }
  if (!isProcessStartTime(record.processStartTime)) {
    return true;
  }
  const startTime = readStartTime({ pid: record.pid });
  return (
    compareProcessStartTimes({ recorded: record.processStartTime, current: startTime }) !==
    'different'
  );
}

// The app's live dev instance, or null. Blocks while it reads a start time;
// a long-running process that must stay responsive (the hub) uses
// readDevInstanceAsync.
function readDevInstance({ configDirectory }) {
  const record = readDevInstanceRecord({ configDirectory });
  if (record === null || !isRecordProcess(record)) {
    return null;
  }
  return record;
}

export default readDevInstance;
