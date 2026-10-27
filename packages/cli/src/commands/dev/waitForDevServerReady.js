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

import { readDevInstance } from '@lowdefy/node-utils';
import { wait } from '@lowdefy/helpers';

// Resolves with the dev server's instance record ({ url, port, ... }) once it
// answers requests, or with null when the server exits first. The record has
// the port the server bound and the base path the app uses.
async function waitForDevServerReady({ context, server, intervalMs = 500 }) {
  let exited = false;
  server.then(
    () => {
      exited = true;
    },
    () => {
      exited = true;
    }
  );
  while (!exited) {
    const instance = readDevInstance({ configDirectory: context.directories.config });
    if (instance !== null && instance.state === 'ready') {
      return instance;
    }
    await wait(intervalMs);
  }
  return null;
}

export default waitForDevServerReady;
