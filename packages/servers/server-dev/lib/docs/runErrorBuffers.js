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

// The error buffers of the headless runs open now (journey runs and explorer
// walks), keyed by the run id and journey their recording cookie carries.
// Kept on globalThis because the routes that open a run and the error stores
// that feed it may load as separate module instances in one process (Vite's
// SSR module graph and Node's), like the mutant runs.
const REGISTRY_KEY = Symbol.for('lowdefy.devServer.runErrorBuffers');
globalThis[REGISTRY_KEY] ??= new Map();
const buffers = globalThis[REGISTRY_KEY];

function bufferKey({ run, journey }) {
  return JSON.stringify([run, journey ?? null]);
}

// Opens the buffer the errors a run's browser contexts cause collect in.
// `journey` is the cookie's run.journey: a journey's name or a walk id, or
// null for a run that names none. Registering an open buffer again shares it:
// it stays open until every holder has released it.
function registerRunBuffer({ run, journey }) {
  if (!type.isString(run) || !(type.isNull(journey) || type.isString(journey))) {
    throw new Error(
      `registerRunBuffer requires a string "run" and a string or null "journey". Received ${JSON.stringify(
        { run, journey }
      )}.`
    );
  }
  const key = bufferKey({ run, journey });
  const open = buffers.get(key);
  if (!type.isUndefined(open)) {
    open.holders += 1;
    return;
  }
  buffers.set(key, { errors: [], holders: 1 });
}

// An error entry stamped with a run's recording goes to that run's buffer,
// and nowhere else. Returns whether an open buffer took it: an entry for a
// run whose buffer was released is the caller's to drop.
function recordRunError(entry) {
  const buffer = buffers.get(
    bufferKey({ run: entry.recording?.run, journey: entry.recording?.journey })
  );
  if (type.isUndefined(buffer)) {
    return false;
  }
  buffer.errors.push(entry);
  return true;
}

// Removes and returns the run's errors whose timestamp falls in
// [since, until] (milliseconds): what one step's window caused.
function takeRunErrors({ run, journey, since, until }) {
  const buffer = buffers.get(bufferKey({ run, journey }));
  if (type.isUndefined(buffer)) {
    return [];
  }
  const taken = [];
  const kept = [];
  buffer.errors.forEach((entry) => {
    const time = Date.parse(entry.timestamp);
    if (time >= since && time <= until) {
      taken.push(entry);
    } else {
      kept.push(entry);
    }
  });
  buffer.errors = kept;
  return taken;
}

function releaseRunBuffer({ run, journey }) {
  const key = bufferKey({ run, journey });
  const buffer = buffers.get(key);
  if (type.isUndefined(buffer)) {
    return;
  }
  buffer.holders -= 1;
  if (buffer.holders === 0) {
    buffers.delete(key);
  }
}

export { recordRunError, registerRunBuffer, releaseRunBuffer, takeRunErrors };
