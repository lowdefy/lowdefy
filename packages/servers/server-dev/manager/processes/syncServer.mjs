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

// Brings the running server up to date with the build: installs plugin
// packages added to the server's package.json (by a config build, or by a
// page build that found a missing package) and rebuilds so the plugin imports
// include them, then restarts the server when anything it read at start
// changed, or when the caller needs a new process anyway (.env, local plugin
// code). Every watcher calls it after its build, so the restart a build
// needs is part of that watcher's batch and a build-status wait covers it.
// Calls run one at a time: the second finds the first's work done.
function syncServer(context) {
  async function sync({ restart = false } = {}) {
    const changes = context.serverArtifacts.check();
    if (changes.install) {
      context.shutdownServer();
      context.logger.warn('Plugin dependencies have changed and will be reinstalled.');
      try {
        await context.installPlugins();
        await context.lowdefyBuild();
        // The new plugins' dependencies are optimised in a short-lived
        // process, so the restarted child starts warm (optimizeDependencies.mjs).
        await context.buildActivity.track(() => context.optimizeDependencies());
      } finally {
        await context.restartServer();
      }
      return;
    }
    if (restart || changes.restart) {
      await context.restartServer();
    }
  }

  let previous = Promise.resolve();
  return (options) => {
    const next = previous.then(() => sync(options));
    previous = next.catch(() => {});
    return next;
  };
}

export default syncServer;
