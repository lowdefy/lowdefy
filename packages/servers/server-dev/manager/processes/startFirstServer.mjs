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

import startServer from './startServer.mjs';

// The manager's first child start: dependencies are optimised in a
// short-lived process first, so the child never runs the optimiser itself
// (see optimizeDependencies.mjs). The watchers start only once the child has
// started: startServer records the server artifacts, and a watcher batch
// before that (a late file event from the initial build, an edit) would find
// every artifact changed and restart a child that does not exist yet, which
// then optimises itself and is killed when this start goes ahead.
async function startFirstServer(context) {
  await context.optimizeDependencies();
  startServer(context);
  // Not awaited: chokidar's ready event is unreliable.
  context.startWatchers();
}

export default startFirstServer;
