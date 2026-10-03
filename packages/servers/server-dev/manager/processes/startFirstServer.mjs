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
// (see optimizeDependencies.mjs). It runs at the head of syncServer's queue,
// so a watcher batch during the optimise (a late file event from the initial
// build, an edit) builds at once and syncs after this start, instead of
// restarting a child that does not exist yet.
//
// The server artifacts are recorded before the optimise, not when the child
// spawns: a build during the optimise that adds a plugin package to
// package.json must still read as an install for the queued sync. An
// artifact that changed in that window costs one extra restart at most.
function startFirstServer(context) {
  return context.syncServer.startFirst(async () => {
    context.serverArtifacts.record();
    await context.optimizeDependencies();
    startServer(context);
  });
}

export default startFirstServer;
