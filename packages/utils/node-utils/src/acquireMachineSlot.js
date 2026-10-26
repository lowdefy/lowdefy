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
import { type, wait } from '@lowdefy/helpers';

import createStartTimeCache from './createStartTimeCache.js';
import getLowdefyHome from './getLowdefyHome.js';
import getProcessStartTime from './getProcessStartTime.js';
import isPidAlive from './isPidAlive.js';

// A waiting caller checks every held slot each interval, and a start time costs a ps process
// (PowerShell on Windows, a second or more), so each pid's is read once a few seconds.
const readStartTime = createStartTimeCache({ read: getProcessStartTime });

// This process's start time never changes, so it is read once, not once a call: a dev server
// takes a slot for every browser operation.
let ownStartTime;
function readOwnStartTime() {
  if (type.isUndefined(ownStartTime)) {
    ownStartTime = getProcessStartTime({ pid: process.pid });
  }
  return ownStartTime;
}

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
  const startTime =
    holder.pid === process.pid ? readOwnStartTime() : readStartTime({ pid: holder.pid });
  return startTime !== null && startTime !== holder.processStartTime;
}

function describeWait(waitMs) {
  if (waitMs >= 60000) {
    const minutes = Math.round(waitMs / 60000);
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }
  return `${waitMs / 1000} seconds`;
}

// The live holders of every numbered slot in directory, read for a waiter's
// progress note and before taking a slot. A slot past the current limit counts
// too: a run that took slot 1 when the limit was 2 is still running when a
// later caller's limit is 1.
function readLiveHolders(directory) {
  let entries;
  try {
    entries = fs.readdirSync(directory);
  } catch {
    return [];
  }
  return entries
    .filter((entry) => /^\d+$/.test(entry))
    .sort((a, b) => Number(a) - Number(b))
    .map((entry) => path.join(directory, entry))
    .filter((slotPath) => !isStale(slotPath))
    .map(readHolder)
    .filter((holder) => holder !== null);
}

function timeoutError({ name, limit, waitMs }) {
  const error = new Error(
    `All ${limit} ${name} slots on this machine stayed busy for ${describeWait(waitMs)}. Try again.`
  );
  error.code = 'MACHINE_SLOT_TIMEOUT';
  error.slot = name;
  error.limit = limit;
  return error;
}

/*
Takes one of limit slots named name, shared by every process of this user on
the machine, waiting up to waitMs for one to free. A slot is a file
<LOWDEFY_HOME>/slots/<name>/<n> holding the taker's pid and process start
time, so it is held by the process doing the work, whichever route the work
came in by, and a process that dies frees its slots. Returns { release }.

describe adds fields to the slot file, so a waiter can say who holds a slot.
onWait({ waitedMs, holders }) is called every onWaitIntervalMs while the
caller waits, with the live holders' slot files. A wait that runs out throws
an error with code MACHINE_SLOT_TIMEOUT, the slot's name as slot, and limit.
Waiters are not served in order.

Two processes reclaiming the same stale slot at once can briefly let one
more holder through. The bound is about memory, not correctness, so that is
accepted rather than locked against.
*/
async function acquireMachineSlot({
  name,
  limit,
  waitMs = 5 * 60 * 1000,
  intervalMs = 250,
  describe = {},
  onWait,
  onWaitIntervalMs = 30 * 1000,
}) {
  const directory = path.join(getLowdefyHome(), 'slots', name);
  fs.mkdirSync(directory, { recursive: true });
  const holder = {
    ...describe,
    pid: process.pid,
    processStartTime: readOwnStartTime(),
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
    // A caller with a lower limit than earlier holders had waits until they
    // drop below it, rather than taking a free low-numbered slot beside them.
    if (readLiveHolders(directory).length >= limit) {
      return null;
    }
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

  const started = Date.now();
  const deadline = started + waitMs;
  let nextNote = started + onWaitIntervalMs;
  for (;;) {
    const slotPath = tryTake();
    if (slotPath !== null) {
      return { release: release(slotPath) };
    }
    const now = Date.now();
    if (now >= deadline) {
      throw timeoutError({ name, limit, waitMs });
    }
    if (type.isFunction(onWait) && now >= nextNote) {
      nextNote = now + onWaitIntervalMs;
      onWait({ waitedMs: now - started, holders: readLiveHolders(directory) });
    }
    await wait(intervalMs);
  }
}

export default acquireMachineSlot;
