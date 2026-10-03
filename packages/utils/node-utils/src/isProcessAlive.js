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

import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';

// A pid plus its start time names one process; the pid alone can be reused.
// Without a recorded start time (a record written before start times were
// read on its platform), or when the current one cannot be read, the pid
// decides. Erring towards "alive" keeps a live server, or its
// owner, from ever being taken for a dead one.
function isProcessAlive({ pid, processStartTime }) {
  if (!isPidAlive(pid)) {
    return false;
  }
  if (type.isNone(processStartTime)) {
    return true;
  }
  const startTime = getProcessStartTime({ pid });
  return type.isNone(startTime) || startTime === processStartTime;
}

export default isProcessAlive;
