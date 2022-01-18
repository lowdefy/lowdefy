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

import path from 'path';
import setupWatcher from './setupWatcher.mjs';
import wait from '../wait.mjs';

async function envWatcher(context) {
  const callback = async () => {
    console.log('.env file changed, restarting server...');
    context.reloadClients({ type: 'hard' });
    // Wait for clients to get reload event.
    await wait(500);
    context.restartServer();
  };
  // TODO: Add ignored paths
  return setupWatcher({
    callback,
    watchPaths: [path.resolve(context.directories.config, '.env')],
    watchDotfiles: true,
  });
}

export default envWatcher;
