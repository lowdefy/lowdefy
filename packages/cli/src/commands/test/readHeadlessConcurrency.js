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

import os from 'os';
import { type } from '@lowdefy/helpers';

import readMemoryPressure from '../hub/readMemoryPressure.js';

// A --build run's worker thread holds the whole server and client engine: about 400 MB on a large
// production app. One journey thread per GiB of the memory the process may use (its container's
// limit when it has one) leaves each thread more than twice that, so a 2-core 7 GB CI runner still
// runs two journeys at once.
const MEMORY_PER_JOURNEY = 1024 ** 3;
// Up to this many cores, the run uses every one: a CI runner has 2 to 4, and the run's own work
// (the CLI, the data store) waits on journeys more than it competes with them. Above it, one core
// is left for that work.
const ALL_CORES_UP_TO = 4;
// How long a memory pressure reading holds: reading it runs a command, and the pool reads it before
// every journey it starts beside another.
const PRESSURE_TTL_MS = 1000;

function readMemory() {
  const constrained = process.constrainedMemory?.();
  return constrained > 0 ? Math.min(constrained, os.totalmem()) : os.totalmem();
}

// The default: every core on a machine of up to ALL_CORES_UP_TO cores, else every core but one; no
// more than one journey per MEMORY_PER_JOURNEY; and at least one journey.
function readDefault({ cores, memory }) {
  const byCores = cores <= ALL_CORES_UP_TO ? cores : cores - 1;
  return Math.max(1, Math.min(byCores, Math.floor(memory / MEMORY_PER_JOURNEY)));
}

function cachePressure({ readPressure, now }) {
  let reading;
  let readAt = -Infinity;
  return () => {
    if (now() - readAt >= PRESSURE_TTL_MS) {
      reading = readPressure();
      readAt = now();
    }
    return reading;
  };
}

// How many headless journeys one test run keeps in flight: { size, readLimit } or { error }. `size`
// is the most the run ever runs at once, the number of places it opens to run them in
// (runHeadlessTests' worker threads); readLimit() is how many it may run now. The size is
// `concurrency` when the run was given one (`typed`: --concurrency on the command line, or
// lowdefy_run_tests' concurrency), any integer from 1 up, named `name` in a refusal; else the
// machine's cores (less one above 4 cores), and no more than one per GiB of memory (readDefault). A
// concurrency from lowdefy.yaml's cli config or LOWDEFY_JOURNEY_CONCURRENCY is not read: both size
// browser journeys, which share three browser slots (readJourneyConcurrency). A --repeat run
// measures flakiness, so it runs one at a time: a journey that fails only beside another is the
// flakiness it was asked to find. readLimit() reads memory pressure (the pool calls it before
// starting a journey beside another), at most once a second, and gives 1 while it is warn or
// critical.
function readHeadlessConcurrency({
  concurrency: value,
  typed,
  name,
  repeat,
  cores = os.availableParallelism(),
  memory = readMemory(),
  readPressure = readMemoryPressure,
  now = Date.now,
}) {
  let size = readDefault({ cores, memory });
  if (typed === true && !type.isNone(value)) {
    const concurrency = Number(value);
    if (
      (!type.isNumber(value) && !type.isString(value)) ||
      (type.isString(value) && value.trim() === '') ||
      !Number.isInteger(concurrency) ||
      concurrency < 1
    ) {
      return {
        error: `${name} must be a whole number of journeys at once, 1 or more. Received ${JSON.stringify(
          value
        )}.`,
      };
    }
    size = concurrency;
  }
  if (size === 1 || repeat > 1) {
    return { size: 1, readLimit: () => 1 };
  }
  const readCachedPressure = cachePressure({ readPressure, now });
  return {
    size,
    readLimit: () => {
      const pressure = readCachedPressure();
      if (pressure === 'warn' || pressure === 'critical') {
        return 1;
      }
      return size;
    },
  };
}

export default readHeadlessConcurrency;
