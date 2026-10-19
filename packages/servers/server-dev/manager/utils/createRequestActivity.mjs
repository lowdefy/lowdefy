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
Whether anyone is using this dev server, for readers in other processes: the
hub stops a server nobody has used for a while, judged from the fields this
writes into the instance record (lastActivityAt, activeRequests). The manager
counts here because it owns the public port and outlives every child restart,
so it sees every caller (agents, lowdefy test, curl, the browser) and keeps
its count across restarts.

A page load is hundreds of short requests, so writes are throttled to one
per throttleMs, with a trailing write so the final count always lands. The
record is then never more than throttleMs behind, far inside the shortest
idle limit. A request starting while the record last said 0 in flight is
written at once, so a reader never sees a busy server as idle-with-nothing-
in-flight longer than it takes to write.
*/
function createRequestActivity({ onChange, throttleMs = 5000, now = Date.now }) {
  let activeRequests = 0;
  let lastActivityAt = now();
  let lastWriteAt = -Infinity;
  let writtenActiveRequests = 0;
  let trailingTimer = null;

  function write() {
    if (trailingTimer !== null) {
      clearTimeout(trailingTimer);
      trailingTimer = null;
    }
    lastWriteAt = now();
    writtenActiveRequests = activeRequests;
    onChange({ lastActivityAt: new Date(lastActivityAt).toISOString(), activeRequests });
  }

  function schedule() {
    const sinceWrite = now() - lastWriteAt;
    if (sinceWrite >= throttleMs) {
      write();
      return;
    }
    if (trailingTimer === null) {
      trailingTimer = setTimeout(write, throttleMs - sinceWrite);
      // A pending write must not keep the manager alive on shutdown.
      trailingTimer.unref?.();
    }
  }

  function touch() {
    lastActivityAt = now();
    schedule();
  }

  function begin() {
    activeRequests += 1;
    lastActivityAt = now();
    if (writtenActiveRequests === 0) {
      write();
      return;
    }
    schedule();
  }

  function end() {
    activeRequests -= 1;
    touch();
  }

  // Counts one request from now until its response finishes or its client goes away.
  function trackResponse(res) {
    begin();
    let ended = false;
    function onEnd() {
      if (ended) return;
      ended = true;
      end();
    }
    res.once('finish', onEnd);
    res.once('close', onEnd);
  }

  write();

  return { begin, end, touch, trackResponse };
}

export default createRequestActivity;
