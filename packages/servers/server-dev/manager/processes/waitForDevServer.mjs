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

import waitForServer from '../utils/waitForServer.mjs';

// Waits for the child just started (by the first start or a restart) to
// answer, and resolves with whether it answered within the wait. Whichever
// child answers first marks the server ready: a first child that exits at
// start (a plugin that fails to load) leaves it to a later restart.
//
// A child still running when the wait ends may yet answer - a first start on
// a loaded machine has taken two and a half minutes. Its first answer still
// marks the server ready, or the hub would judge a working server stalled and
// stop it. That later wait holds up nothing, and ends when the child exits
// (a restart replaces it, or it crashes), so a child that never answers is
// never marked ready.
async function waitForDevServer(context) {
  const options = {
    basePath: context.basePath,
    child: context.devServer,
    port: context.internalPort,
  };
  if (await waitForServer(options)) {
    context.markServerReady();
    return true;
  }
  waitForServer({ ...options, timeoutMs: Infinity }).then((answered) => {
    if (answered) {
      context.markServerReady();
    }
  });
  return false;
}

export default waitForDevServer;
