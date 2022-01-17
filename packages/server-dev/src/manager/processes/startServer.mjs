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

import spawnKillableProcess from '../spawnKillableProcess.mjs';

function startServerProcess({ context, handleExit }) {
  context.serverProcess = spawnKillableProcess({
    logger: console,
    args: ['run', 'next', 'start'],
    command: context.packageManager,
    silent: false,
  });
  context.serverProcess.on('exit', handleExit);
  context.restartServer = () => {
    console.log('Restarting server...');
    context.serverProcess.kill();
    startServerProcess({ context, handleExit });
  };
  context.shutdownServer = () => {
    console.log('Shutting down server...');
    context.serverProcess.kill();
  };
}

async function startServer(context) {
  return new Promise((resolve, reject) => {
    function handleExit(code) {
      if (code !== 0) {
        context.shutdownServer && context.shutdownServer();
        reject(new Error('Server error.'));
      }
      resolve();
    }
    try {
      startServerProcess({ context, handleExit });
    } catch (error) {
      context.shutdownServer && context.shutdownServer();
      reject(error);
    }
  });
}

export default startServer;
