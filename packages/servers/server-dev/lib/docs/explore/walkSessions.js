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

import { registerRunBuffer, releaseRunBuffer, takeRunErrors } from '../runErrorBuffers.js';

// The open explorer walks, keyed by walk id. Kept on globalThis because the
// walk routes that open a walk and the error stores that feed it may load as
// separate module instances in one process (Vite's SSR module graph and
// Node's), like the mutant runs.
const REGISTRY_KEY = Symbol.for('lowdefy.devServer.walkSessions');
globalThis[REGISTRY_KEY] ??= new Map();
const walks = globalThis[REGISTRY_KEY];

// Opens a walk's record: its explorer run id and walk id (the recording
// cookie's run.id and run.journey) and whatever state the walk routes keep.
// Errors its browser contexts cause collect in its own run error buffer.
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
  const walk = { ...state, walkId, run, journey };
  walks.set(walkId, walk);
  registerRunBuffer({ run, journey });
  return walk;
}

function getWalk(walkId) {
  return walks.get(walkId) ?? null;
}

// Closing a walk's record releases its error buffer: an error stamped for it
// that arrives later is dropped.
function removeWalk(walkId) {
  const walk = walks.get(walkId);
  if (type.isUndefined(walk)) {
    return;
  }
  walks.delete(walkId);
  releaseRunBuffer({ run: walk.run, journey: walk.journey });
}

function listWalks() {
  return [...walks.values()];
}

// Removes and returns the walk's errors whose timestamp falls in
// [since, until] (milliseconds): what one step's window caused.
function takeErrors({ walkId, since, until }) {
  const walk = walks.get(walkId);
  if (type.isUndefined(walk)) {
    return [];
  }
  return takeRunErrors({ run: walk.run, journey: walk.journey, since, until });
}

export { getWalk, listWalks, registerWalk, removeWalk, takeErrors };
