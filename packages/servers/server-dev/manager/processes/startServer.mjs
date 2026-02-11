/*
  Copyright 2020-2024 Lowdefy, Inc

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

function createStdErrLineHandler({ context }) {
  const port = context.options.port;
  return function stdErrLineHandler(line) {
    if (line.includes('EADDRINUSE')) {
      context.logger.error(
        `Port ${port} is already in use. Stop the other process or use a different port with --port.`
      );
      return;
    }
    context.logger.error(line);
  };
}

function startServer(context) {
  context.shutdownServer();

  const nextServer = spawn('node', [context.bin.next, 'start'], {
    stdio: ['ignore', 'inherit', 'pipe'],
    env: {
      ...process.env,
      LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
      PORT: context.options.port,
    },
  });

  const stdErrLineHandler = createStdErrLineHandler({ context });
  nextServer.stderr.on('data', (data) => {
    data
      .toString('utf8')
      .split('\n')
      .forEach((line) => {
        if (line) stdErrLineHandler(line);
      });
  });

  context.logger.debug(`Started next server with pid ${nextServer.pid}.`);
  nextServer.on('exit', (code, signal) => {
    context.logger.debug(`nextServer exit ${nextServer.pid}, signal: ${signal}, code: ${code}`);
  });
  nextServer.on('error', (error) => {
    context.logger.error(error);
  });
  context.nextServer = nextServer;
}

export default startServer;
