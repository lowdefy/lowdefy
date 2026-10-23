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
// Calls run one at a time, after the first child start (startFirst): the
// second finds the first's work done.
//
// While the child is stopped for being idle (createIdleChild), a restart the
// build needs is only marked pending: the next waking request starts the
// child through restartServer, which records the server artifacts, so an
// edit or a branch switch on a server nobody uses never starts it. The
// install path still installs, rebuilds and optimises, so the woken child
// starts warm.
function syncServer(context) {
  function deferWhileStopped() {
    if (context.idleChild?.isStopped() !== true) {
      return false;
    }
    context.idleChild.markRestartPending();
    // No child runs, so the next start reads every artifact as it is now. Recorded here so the
    // next build while stopped does not see the same package.json change and install again.
    context.serverArtifacts.record();
    return true;
  }

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
        if (!deferWhileStopped()) {
          await context.restartServer();
        }
      }
      return;
    }
    if ((restart || changes.restart) && !deferWhileStopped()) {
      await context.restartServer();
    }
  }

  // The first child start heads the queue. The watchers start right after the
  // initial build, so a batch can sync before the first child exists; it
  // waits here instead of comparing against artifacts no child has read.
  let runFirstStart;
  const firstStart = new Promise((resolve) => {
    runFirstStart = resolve;
  }).then((start) => start());
  let previous = firstStart.catch(() => {});

  function queue(task) {
    const next = previous.then(task);
    previous = next.catch(() => {});
    return next;
  }

  function queueSync(options) {
    return queue(() => sync(options));
  }
  // Child lifecycle work outside a sync (the idle stop and the wake) runs in
  // the same queue, so it never interleaves with a restart or an install.
  queueSync.run = queue;
  queueSync.startFirst = (start) => {
    runFirstStart(start);
    return firstStart;
  };
  return queueSync;
}

export default syncServer;
