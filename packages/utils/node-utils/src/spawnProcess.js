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

import { spawn } from 'child_process';

function createStdIOHandler({ lineHandler }) {
  let buffer = '';
  function handler(data) {
    const text = buffer + data.toString('utf8');
    const lines = text.split('\n');
    buffer = lines.pop();
    lines.forEach((line) => {
      if (line) {
        lineHandler(line);
      }
    });
  }
  handler.flush = () => {
    if (buffer) {
      lineHandler(buffer);
      buffer = '';
    }
  };
  return handler;
}

function spawnProcess({
  args,
  command,
  processOptions,
  returnProcess,
  stdErrLineHandler,
  stdOutLineHandler = () => {},
}) {
  if (!stdErrLineHandler) {
    stdErrLineHandler = stdOutLineHandler;
  }
  const process = spawn(command, args, processOptions);
  const stdOutHandler = createStdIOHandler({ lineHandler: stdOutLineHandler });
  const stdErrHandler = createStdIOHandler({ lineHandler: stdErrLineHandler });
  process.stdout.on('data', stdOutHandler);
  process.stderr.on('data', stdErrHandler);
  process.stdout.on('end', stdOutHandler.flush);
  process.stderr.on('end', stdErrHandler.flush);

  if (returnProcess) {
    return process;
  }

  return new Promise((resolve, reject) => {
    process.on('error', (error) => {
      stdErrLineHandler(error);
    });

    process.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code}`));
      }
      resolve();
    });
  });
}

export default spawnProcess;
