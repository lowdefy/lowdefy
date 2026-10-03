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
import { type } from '@lowdefy/helpers';

import getProcessStartTimeCommand from './getProcessStartTimeCommand.js';

// The process's start time in epoch milliseconds, equal across reads and
// readers for one process whatever their time zone. Null when it cannot be
// read: the process is gone, or ps (PowerShell on Windows) failed. Callers
// treat null as "unknown", never as proof either way.
function getProcessStartTime({ pid }) {
  const { command, args, options, parse } = getProcessStartTimeCommand({ pid });
  const result = spawnSync(command, args, { ...options, encoding: 'utf8' });
  // A read that timed out or failed may have printed part of a start time,
  // which would compare unequal and be taken for another process.
  if (!type.isNone(result.error) || result.status !== 0) {
    return null;
  }
  return parse(result.stdout ?? '');
}

export default getProcessStartTime;
