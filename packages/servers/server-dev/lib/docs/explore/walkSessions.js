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

// The open explorer walks, keyed by walk id. Kept on globalThis because the
// walk routes that open a walk and the error stores that feed it may load as
// separate module instances in one process (Vite's SSR module graph and
// Node's), like the mutant runs.
const REGISTRY_KEY = Symbol.for('lowdefy.devServer.walkSessions');
globalThis[REGISTRY_KEY] ??= new Map();
const walks = globalThis[REGISTRY_KEY];

// Opens a walk's record: its explorer run id and walk id (the recording
// cookie's run.id and run.journey) and whatever state the walk routes keep.
// Errors its browser contexts cause collect in its own buffer.
function registerWalk({ walkId, run, journey, ...state }) {
  if (!type.isString(walkId) || !type.isString(run) || !type.isString(journey)) {
    throw new Error(
      `registerWalk requires string "walkId", "run" and "journey". Received ${JSON.stringify({
        walkId,
        run,
        journey,
      })}.`
    );
  }
  const walk = { ...state, walkId, run, journey, errors: [] };
  walks.set(walkId, walk);
  return walk;
}

function getWalk(walkId) {
  return walks.get(walkId) ?? null;
}

function removeWalk(walkId) {
  walks.delete(walkId);
}

function listWalks() {
  return [...walks.values()];
}

// An error entry stamped with an explorer recording (tagged with the store it
// came to, client or server) goes to the buffer of the
// open walk whose run and walk id it carries, and nowhere else. An entry for a
// walk that has closed is dropped. Returns whether a walk took it.
function recordError(entry) {
  const walk = [...walks.values()].find(
    (candidate) =>
      candidate.run === entry.recording?.run && candidate.journey === entry.recording?.journey
  );
  if (type.isUndefined(walk)) {
    return false;
  }
  walk.errors.push(entry);
  return true;
}

// Removes and returns the walk's errors whose timestamp falls in
// [since, until] (milliseconds): what one step's window caused.
function takeErrors({ walkId, since, until }) {
  const walk = walks.get(walkId);
  if (type.isUndefined(walk)) {
    return [];
  }
  const taken = [];
  const kept = [];
  walk.errors.forEach((entry) => {
    const time = Date.parse(entry.timestamp);
    if (time >= since && time <= until) {
      taken.push(entry);
    } else {
      kept.push(entry);
    }
  });
  walk.errors = kept;
  return taken;
}

export { getWalk, listWalks, recordError, registerWalk, removeWalk, takeErrors };
