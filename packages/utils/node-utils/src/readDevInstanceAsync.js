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
import isPidAlive from './isPidAlive.js';
import isProcessStartTime from './isProcessStartTime.js';
import readDevInstanceRecord from './readDevInstanceRecord.js';
import readProcessStartTime from './readProcessStartTime.js';

const readStartTime = createStartTimeCache({ read: readProcessStartTime });

async function isRecordProcess(record) {
  if (!isPidAlive(record.pid)) {
    return false;
  }
  if (!isProcessStartTime(record.processStartTime)) {
    return true;
  }
  const startTime = await readStartTime({ pid: record.pid });
  return (
    compareProcessStartTimes({ recorded: record.processStartTime, current: startTime }) !==
    'different'
  );
}

// readDevInstance without blocking the event loop, for the hub: on Windows a
// start time read starts PowerShell, which can take seconds.
async function readDevInstanceAsync({ configDirectory }) {
  const record = readDevInstanceRecord({ configDirectory });
  if (record === null || !(await isRecordProcess(record))) {
    return null;
  }
  return record;
}

export default readDevInstanceAsync;
