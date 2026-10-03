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

import { type } from '@lowdefy/helpers';

import compareProcessStartTimes from './compareProcessStartTimes.js';
import isPidAlive from './isPidAlive.js';
import readProcessStartTime from './readProcessStartTime.js';

// A pid plus its start time names one process; the pid alone can be reused.
// Without a start time to compare (none recorded, one an older Lowdefy wrote
// in another format, or the current one cannot be read), the pid decides.
// Erring towards "alive" keeps a live server, or its owner, from ever being
// taken for a dead one. Reads without blocking: the hub calls it, and on
// Windows each read starts PowerShell.
async function isProcessAlive({ pid, processStartTime }) {
  if (!isPidAlive(pid)) {
    return false;
  }
  // Nothing to compare, so no need to read.
  if (!type.isInt(processStartTime)) {
    return true;
  }
  const startTime = await readProcessStartTime({ pid });
  return (
    compareProcessStartTimes({ recorded: processStartTime, current: startTime }) !== 'different'
  );
}

export default isProcessAlive;
