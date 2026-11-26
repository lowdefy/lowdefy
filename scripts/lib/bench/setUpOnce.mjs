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

import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

// Written once the baseline is fully set up, so a folder left half-built by an
// interrupted run is never mistaken for a ready one.
const READY_MARKER = '.lowdefy-bench-ready';
const HELD_CODES = new Set(['EEXIST', 'ENOTEMPTY', 'EPERM']);

function isReady({ directory, sha }) {
  const markerPath = path.join(directory, READY_MARKER);
  return fs.existsSync(markerPath) && fs.readFileSync(markerPath, 'utf8').trim() === sha;
}

function isAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    // EPERM: the process exists but belongs to another user.
    return error.code === 'EPERM';
  }
}

function readHolder(lockPath) {
  try {
    return Number(fs.readFileSync(path.join(lockPath, 'pid'), 'utf8'));
  } catch {
    return null;
  }
}

// The lock is a folder holding the holder's pid. It is made beside the lock
// path with the pid already in it, then renamed into place: rename onto a
// folder that exists (and is never empty) fails, so exactly one caller wins
// and no one ever sees a lock without its pid.
function tryAcquire(lockPath) {
  const staging = fs.mkdtempSync(`${lockPath}-staging-`);
  fs.writeFileSync(path.join(staging, 'pid'), String(process.pid));
  try {
    fs.renameSync(staging, lockPath);
    return true;
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    if (HELD_CODES.has(error.code)) return false;
    throw error;
  }
}

// A lock whose holder died is moved aside, under a name only this caller uses,
// so two callers taking over the same stale lock never remove each other's new
// one: the second rename finds nothing to move.
function removeStaleLock({ lockPath, pid }) {
  const aside = `${lockPath}-stale-${process.pid}-${Date.now()}`;
  try {
    fs.renameSync(lockPath, aside);
  } catch {
    return;
  }
  if (readHolder(aside) !== pid) {
    // Another caller took the lock over and holds it now: give it back.
    try {
      fs.renameSync(aside, lockPath);
      return;
    } catch {
      // A third caller holds the lock by now; the moved one is stale either way.
    }
  }
  fs.rmSync(aside, { recursive: true, force: true });
}

// Sets the baseline folder up once, however many callers ask at the same time.
// A caller that finds it ready returns at once. Otherwise one caller takes the
// lock (<directory>.lock, beside the folder) and runs create; the others log
// once and wait until the folder is ready, or the lock frees up, or its holder
// died. create runs only while the lock is held, and only when the folder is
// still not ready. Resolves to { reused }.
async function setUpOnce({ create, directory, logger, pollMs = 2000, sha }) {
  const lockPath = `${directory}.lock`;
  let waitingFor = null;
  for (;;) {
    if (isReady({ directory, sha })) {
      return { reused: true };
    }
    if (tryAcquire(lockPath)) {
      try {
        if (isReady({ directory, sha })) {
          return { reused: true };
        }
        await create();
        fs.writeFileSync(path.join(directory, READY_MARKER), `${sha}\n`);
        return { reused: false };
      } finally {
        fs.rmSync(lockPath, { recursive: true, force: true });
      }
    }
    const pid = readHolder(lockPath);
    if (pid !== null && !isAlive(pid)) {
      logger.warn(`Taking over the baseline lock of process ${pid}, which is no longer running.`);
      removeStaleLock({ lockPath, pid });
      continue;
    }
    if (pid !== null && pid !== waitingFor) {
      logger.info(`Waiting for process ${pid} to finish setting up ${directory}.`);
      waitingFor = pid;
    }
    await sleep(pollMs);
  }
}

export { READY_MARKER };
export default setUpOnce;
