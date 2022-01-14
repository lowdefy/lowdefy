/*
  Copyright 2020-2021 Lowdefy, Inc

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

import { spawn } from 'child_process';

function spawnKillableProcess({ logger, command, args, processOptions, silent }) {
  const process = spawn(command, args, processOptions);

  process.stdout.on('data', (data) => {
    if (!silent) {
      data
        .toString('utf8')
        .split('\n')
        .forEach((line) => {
          if (line) {
            logger.log(line);
          }
        });
    }
  });

  process.stderr.on('data', (data) => {
    if (!silent) {
      data
        .toString('utf8')
        .split('\n')
        .forEach((line) => {
          if (line) {
            logger.warn(line);
          }
        });
    }
  });

  process.on('error', (error) => {
    throw error;
  });

  return process;
}

export default spawnKillableProcess;
