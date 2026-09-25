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

import { spawnSync } from 'child_process';

// A pid alone does not identify a process: after a reboot, or enough churn,
// the pid in the hub's registry can belong to something else entirely. The pid
// plus its start time does. Windows has no ps; there the hub relies on the pid.
function getProcessStartTime({ pid }) {
  if (process.platform === 'win32') {
    return null;
  }
  const result = spawnSync('ps', ['-o', 'lstart=', '-p', String(pid)], { encoding: 'utf8' });
  const startTime = (result.stdout ?? '').trim();
  return startTime === '' ? null : startTime;
}

export default getProcessStartTime;
