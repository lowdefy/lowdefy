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

import { spawnProcess } from '@lowdefy/node-utils';
import createStdOutLineHandler from '../utils/createStdOutLineHandler.mjs';

function startServer(context) {
  context.shutdownServer();

  const nextServer = spawnProcess({
    stdOutLineHandler: createStdOutLineHandler({ context }),
    stdErrLineHandler: (line) => context.logger.error(line),
    command: 'node',
    args: [context.bin.next, 'start'],
    processOptions: {
      env: {
        ...process.env,
        LOWDEFY_DIRECTORY_CONFIG: context.directories.config,
        PORT: context.options.port,
      },
    },
    returnProcess: true,
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
