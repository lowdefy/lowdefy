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
// production app. Nine of them on a 16 GB machine shared with a dev server and other runs brought
// macOS to memory pressure, so the limit keeps one thread per 4 GiB of the memory the process may
// use (its container's limit when it has one).
const MEMORY_PER_THREAD = 4 * 1024 ** 3;

function readMemory() {
  const constrained = process.constrainedMemory?.();
  return constrained > 0 ? Math.min(constrained, os.totalmem()) : os.totalmem();
}

// How many headless journeys a machine runs at once by default: its cores less one, which is left
// for the run itself (the CLI, the dev server's other work, the data store), no more than one per
// MEMORY_PER_THREAD, and at least one. `lowdefy test --build` sizes its worker threads by it, and
// the dev server bounds its journey threads by it.
function readHeadlessThreadLimit({
  cores = os.availableParallelism(),
  memory = readMemory(),
} = {}) {
  return Math.max(1, Math.min(cores - 1, Math.floor(memory / MEMORY_PER_THREAD)));
}

export default readHeadlessThreadLimit;
