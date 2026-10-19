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

/*
Machine-wide slots for launching dev servers. A wave of helper agents used
to start every server at once: each build ran several times slower against
the others and each start added about 1 GB of transient memory. With two at
a time the first servers are ready in a fraction of the time, for about the
same total.

A slot belongs to the server, not to the call that asked for it: it is held
from launch until the server is ready, its process is gone, or holdMs has
passed (a hung start must not hold it for ever). Apps waiting for a slot
queue in order, one place per app directory. Deciding is synchronous and
never waits, so the hub's serialized starts and stops are never held up by
a slot.

isStarting({ configDirectory, pid }) says whether a launched server is still
on its way to ready; onFree is called when a slot may have freed and an app
is waiting for one.
*/
function createStartSlots({
  readPressure,
  isStarting,
  onFree,
  holdMs = 5 * 60 * 1000,
  intervalMs = 1000,
  slots = 2,
}) {
  // configDirectory -> { pid, takenAt }; pid is null between taking a slot and launching.
  const holders = new Map();
  const waiting = [];
  let timer = null;

  function limit() {
    // A slot already held is never taken back; fewer new launches start.
    return readPressure() === 'critical' ? 1 : slots;
  }

  function releaseFinished() {
    const now = Date.now();
    holders.forEach((holder, configDirectory) => {
      if (now - holder.takenAt > holdMs) {
        holders.delete(configDirectory);
        return;
      }
      if (holder.pid !== null && !isStarting({ configDirectory, pid: holder.pid })) {
        holders.delete(configDirectory);
      }
    });
  }

  function tick() {
    releaseFinished();
    if (waiting.length > 0) {
      onFree();
    }
    if (holders.size === 0 && waiting.length === 0) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Slots free whether or not a caller is waiting on the server, so they are
  // checked on a timer while any is held or any app waits.
  function watch() {
    if (timer === null) {
      timer = setInterval(tick, intervalMs);
      timer.unref?.();
    }
  }

  function tryTake(configDirectory) {
    releaseFinished();
    if (holders.has(configDirectory)) {
      return true;
    }
    if (holders.size >= limit()) {
      return false;
    }
    holders.set(configDirectory, { pid: null, takenAt: Date.now() });
    watch();
    return true;
  }

  function hold({ configDirectory, pid, takenAt = Date.now() }) {
    holders.set(configDirectory, { pid, takenAt });
    watch();
  }

  function release(configDirectory) {
    holders.delete(configDirectory);
  }

  function enqueue({ configDirectory, env }) {
    if (!isQueued(configDirectory)) {
      waiting.push({ configDirectory, env });
    }
    watch();
  }

  function isQueued(configDirectory) {
    return waiting.some((entry) => entry.configDirectory === configDirectory);
  }

  function dequeue(configDirectory) {
    const index = waiting.findIndex((entry) => entry.configDirectory === configDirectory);
    if (index === -1) {
      return false;
    }
    waiting.splice(index, 1);
    return true;
  }

  // The first waiting app, with a slot taken for it, or null when it must wait on.
  function takeNext() {
    if (waiting.length === 0 || !tryTake(waiting[0].configDirectory)) {
      return null;
    }
    return waiting.shift();
  }

  function ahead(configDirectory) {
    return waiting.findIndex((entry) => entry.configDirectory === configDirectory);
  }

  function isLaunching(configDirectory) {
    return holders.get(configDirectory)?.pid === null;
  }

  function held() {
    return holders.size;
  }

  return {
    ahead,
    dequeue,
    enqueue,
    held,
    hold,
    isLaunching,
    isQueued,
    release,
    takeNext,
    tick,
    tryTake,
  };
}

export default createStartSlots;
