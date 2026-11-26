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

import os from 'node:os';

// A headless journey thread holds the whole server and client engine: about 400 MB on a large
// production app. One thread per GiB of the memory the process may use (its container's limit when
// it has one) leaves each more than twice that, so a 2-core 7 GB CI runner still runs two.
const MEMORY_PER_THREAD = 1024 ** 3;
// Up to this many cores, every one runs a journey: a CI runner has 2 to 4, and the run's own work
// (the CLI, the dev server's other work, the data store) waits on journeys more than it competes
// with them. Above it, one core is left for that work.
const ALL_CORES_UP_TO = 4;

function readMemory() {
  const constrained = process.constrainedMemory?.();
  return constrained > 0 ? Math.min(constrained, os.totalmem()) : os.totalmem();
}

// How many headless journeys a machine runs at once by default: every core on a machine of up to
// ALL_CORES_UP_TO cores, else every core but one; no more than one per MEMORY_PER_THREAD; and at
// least one. `lowdefy test` sizes its runs by it, and the dev server bounds its journey threads by
// it.
function readHeadlessThreadLimit({
  cores = os.availableParallelism(),
  memory = readMemory(),
} = {}) {
  const byCores = cores <= ALL_CORES_UP_TO ? cores : cores - 1;
  return Math.max(1, Math.min(byCores, Math.floor(memory / MEMORY_PER_THREAD)));
}

export default readHeadlessThreadLimit;
