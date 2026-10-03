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

import { execFile } from 'child_process';

import getProcessStartTimeCommand from './getProcessStartTimeCommand.js';

// getProcessStartTime without blocking the event loop, for a check a running
// server repeats (watchOwner): on Windows each read starts PowerShell. Never
// rejects; a failed read resolves to null.
function readProcessStartTime({ pid }) {
  const { command, args, options } = getProcessStartTimeCommand({ pid });
  return new Promise((resolve) => {
    execFile(command, args, { ...options, encoding: 'utf8' }, (error, stdout) => {
      const startTime = (stdout ?? '').trim();
      resolve(startTime === '' ? null : startTime);
    });
  });
}

export default readProcessStartTime;
