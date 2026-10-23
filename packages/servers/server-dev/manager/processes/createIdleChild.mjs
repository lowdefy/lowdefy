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

const IDLE_CHILD_MS = 3 * 60 * 1000;

/*
Stops the Vite child of a dev server nobody uses, and starts it again on the
next request that is use. The child holds most of an idle server's memory
(360 to 720 MB measured); the manager keeps its port, watchers and build
state, so a wake costs a child start and a fresh JIT build of each page as it
is first requested, not a full restart. The hub's own stop of the whole
server is unchanged.

Unused means: no request in flight, no build running, no tab holding a reload
stream open, and nothing counted as activity for idleMs. These are the
manager's own activity counts (createRequestActivity), the record the hub
reads too.

The stop goes through shutdownServer, as any stop does, so a later start
waits for the old child to exit. Stop and wake both run in syncServer's
queue, so neither interleaves with a restart or a plugin install. While the
child is stopped, the proxy answers requests that are not use at once
(startProxy), and syncServer marks a restart pending instead of starting it.

`state` in the instance record stays `ready`: the hub treats any other state
as busy and never stops the server, and waits on `ready`. The record's
`child` field says `stopped` or `running`; older hubs and shims ignore it.
*/
function createIdleChild(context, { idleMs = IDLE_CHILD_MS, checkMs, now = Date.now } = {}) {
  let stopped = false;
  let restartPending = false;
  let waking = null;
  let timer = null;

  function isUnused() {
    const { activeRequests, lastActivityAt, openTabs } = context.requestActivity.snapshot();
    return (
      !context.buildActivity.isBusy() &&
      activeRequests === 0 &&
      openTabs === 0 &&
      now() - lastActivityAt >= idleMs
    );
  }

  function stop() {
    return context.syncServer.run(async () => {
      // Checked again in the queue: a request or a build may have come since.
      if (stopped || waking !== null || !context.devServer || !isUnused()) {
        return false;
      }
      stopped = true;
      context.instance.update({ child: 'stopped' });
      context.shutdownServer();
      context.logger.info(
        { spin: 'succeed' },
        `Stopped the web server after ${Math.round(
          idleMs / 1000
        )} s unused. The next request starts it again.`
      );
      return true;
    });
  }

  // Only a request that is use calls this (startProxy). Two at once start one child.
  function wake() {
    if (!stopped) {
      return waking ?? Promise.resolve();
    }
    stopped = false;
    context.instance.update({ child: 'running' });
    waking = context.syncServer
      .run(async () => {
        // A sync queued ahead of the wake (the install path) already started one.
        if (context.devServer) {
          return;
        }
        context.logger.info(
          restartPending
            ? 'Starting the web server again, with the changes built while it was stopped.'
            : 'Starting the web server again.'
        );
        restartPending = false;
        // The normal start path: waits for the stopped child to exit, records
        // the server artifacts and waits for the new child to answer.
        await context.restartServer();
      })
      .finally(() => {
        waking = null;
      });
    return waking;
  }

  function markRestartPending() {
    restartPending = true;
  }

  function start() {
    context.instance.update({ child: 'running' });
    const interval = checkMs ?? Math.min(10000, Math.max(250, Math.floor(idleMs / 4)));
    timer = setInterval(() => {
      if (!stopped && waking === null && isUnused()) {
        stop().catch((error) => context.logger.error(error));
      }
    }, interval);
    // The check must not keep the manager alive on shutdown.
    timer.unref?.();
  }

  function close() {
    clearInterval(timer);
    timer = null;
  }

  return {
    close,
    isRestartPending: () => restartPending,
    isStopped: () => stopped,
    markRestartPending,
    start,
    stop,
    wake,
  };
}

export { IDLE_CHILD_MS };
export default createIdleChild;
