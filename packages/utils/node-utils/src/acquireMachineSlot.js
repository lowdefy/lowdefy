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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { wait } from '@lowdefy/helpers';

import getLowdefyHome from './getLowdefyHome.js';
import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';

function readHolder(slotPath) {
  try {
    return JSON.parse(fs.readFileSync(slotPath, 'utf8'));
  } catch {
    return null;
  }
}

// A slot file is complete when it appears: it is written aside and linked
// into place, and the link fails when the slot is taken.
function tryCreate({ slotPath, holder }) {
  const temporaryPath = `${slotPath}.${holder.token}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(holder));
  try {
    fs.linkSync(temporaryPath, slotPath);
    return true;
  } catch (error) {
    if (error.code === 'EEXIST') {
      return false;
    }
    throw error;
  } finally {
    fs.rmSync(temporaryPath, { force: true });
  }
}

// A slot whose process is gone is free, so a killed holder never keeps one.
// The start time tells a reused pid from the process that took the slot.
function isStale(slotPath) {
  const holder = readHolder(slotPath);
  if (holder === null) {
    return fs.existsSync(slotPath);
  }
  if (!isPidAlive(holder.pid)) {
    return true;
  }
  if (holder.processStartTime === null) {
    return false;
  }
  const startTime = getProcessStartTime({ pid: holder.pid });
  return startTime !== null && startTime !== holder.processStartTime;
}

function describeWait(waitMs) {
  if (waitMs >= 60000) {
    const minutes = Math.round(waitMs / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${waitMs / 1000} seconds`;
}

/*
Takes one of limit slots named name, shared by every process of this user on
the machine, waiting up to waitMs for one to free. A slot is a file
<LOWDEFY_HOME>/slots/<name>/<n> holding the taker's pid and process start
time, so it is held by the process doing the work, whichever route the work
came in by, and a process that dies frees its slots. Returns { release }.

Two processes reclaiming the same stale slot at once can briefly let one
more holder through. The bound is about memory, not correctness, so that is
accepted rather than locked against.
*/
async function acquireMachineSlot({ name, limit, waitMs = 5 * 60 * 1000, intervalMs = 250 }) {
  const directory = path.join(getLowdefyHome(), 'slots', name);
  fs.mkdirSync(directory, { recursive: true });
  const holder = {
    pid: process.pid,
    processStartTime: getProcessStartTime({ pid: process.pid }),
    token: crypto.randomUUID(),
    acquiredAt: new Date().toISOString(),
  };

  function release(slotPath) {
    let released = false;
    return function releaseSlot() {
      if (released) {
        return;
      }
      released = true;
      if (readHolder(slotPath)?.token === holder.token) {
        fs.rmSync(slotPath, { force: true });
      }
    };
  }

  function tryTake() {
    for (let index = 0; index < limit; index += 1) {
      const slotPath = path.join(directory, String(index));
      if (tryCreate({ slotPath, holder })) {
        return slotPath;
      }
      if (isStale(slotPath)) {
        fs.rmSync(slotPath, { force: true });
        if (tryCreate({ slotPath, holder })) {
          return slotPath;
        }
      }
    }
    return null;
  }

  const deadline = Date.now() + waitMs;
  for (;;) {
    const slotPath = tryTake();
    if (slotPath !== null) {
      return { release: release(slotPath) };
    }
    if (Date.now() >= deadline) {
      throw new Error(
        `All ${limit} ${name} slots on this machine stayed busy for ${describeWait(
          waitMs
        )}. Try again.`
      );
    }
    await wait(intervalMs);
  }
}

export default acquireMachineSlot;
