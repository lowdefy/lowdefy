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

import { type } from '@lowdefy/helpers';

import compareProcessStartTimes from './compareProcessStartTimes.js';
import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';
import readProcessStartTime from './readProcessStartTime.js';

// process.kill(pid, 0) forks nothing, so the owner is checked often. Reading
// its start time costs a ps process (PowerShell on Windows), so a reused pid
// is caught once a minute, read without blocking the server.
const POLL_INTERVAL_MS = 2000;
const POLLS_PER_START_TIME_CHECK = 30;

function parseOwnerPid(value) {
  const pid = Number(value);
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new Error(
      `LOWDEFY_EXIT_WITH_PID must be a process id. Received ${JSON.stringify(value)}.`
    );
  }
  return pid;
}

// A Lowdefy server is often started by something else - a test runner, a
// script, an agent's command - through wrappers (pnpm, npx, sh) any of which
// can be the one that dies. The server itself watches, and only when its
// spawner asks it to, so a server run directly (Docker, Vercel, systemd) is
// unaffected.
//
// LOWDEFY_EXIT_ON_STDIN_CLOSE: the spawner holds this process's stdin pipe;
// the pipe closes when the spawner dies, however it dies.
// LOWDEFY_EXIT_WITH_PID: the spawner names its owner process; environment
// variables pass through every wrapper, where arguments do not.
function watchOwner({ onExit, env = process.env, stdin = process.stdin }) {
  let exited = false;
  let interval = null;

  function stop() {
    if (interval !== null) {
      clearInterval(interval);
      interval = null;
    }
  }

  function exit({ reason }) {
    if (exited) {
      return;
    }
    exited = true;
    stop();
    onExit({ reason });
  }

  if (env.LOWDEFY_EXIT_ON_STDIN_CLOSE === '1') {
    const onClosed = () => exit({ reason: 'stdin-closed' });
    stdin.on('end', onClosed);
    stdin.on('close', onClosed);
    stdin.on('error', onClosed);
    // Flowing with no data listener: anything written is read and dropped.
    stdin.resume();
    // The pipe must not keep a process alive that is otherwise done.
    if (type.isFunction(stdin.unref)) {
      stdin.unref();
    }
  }

  if (type.isNone(env.LOWDEFY_EXIT_WITH_PID) || env.LOWDEFY_EXIT_WITH_PID === '') {
    return { ownerPid: null, ownerStartTime: null, stop };
  }

  const ownerPid = parseOwnerPid(env.LOWDEFY_EXIT_WITH_PID);
  // Null when it cannot be read; then the pid alone has to do.
  const ownerStartTime = getProcessStartTime({ pid: ownerPid });

  if (!isPidAlive(ownerPid)) {
    exit({ reason: 'owner-gone' });
    return { ownerPid, ownerStartTime, stop };
  }

  let polls = 0;
  let checkingStartTime = false;
  interval = setInterval(() => {
    polls += 1;
    if (!isPidAlive(ownerPid)) {
      exit({ reason: 'owner-gone' });
      return;
    }
    if (
      type.isNone(ownerStartTime) ||
      checkingStartTime ||
      polls % POLLS_PER_START_TIME_CHECK !== 0
    ) {
      return;
    }
    checkingStartTime = true;
    readProcessStartTime({ pid: ownerPid }).then((startTime) => {
      checkingStartTime = false;
      // Stopped while the read was running.
      if (interval === null) {
        return;
      }
      // A null read is no proof the owner is gone: ps itself can fail (no free
      // memory or file descriptors). An owner that did exit fails isPidAlive
      // on the next poll.
      if (
        compareProcessStartTimes({ recorded: ownerStartTime, current: startTime }) === 'different'
      ) {
        exit({ reason: 'owner-gone' });
      }
    });
  }, POLL_INTERVAL_MS);
  interval.unref();

  return { ownerPid, ownerStartTime, stop };
}

export default watchOwner;
