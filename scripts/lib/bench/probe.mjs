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
import { isMainThread } from 'node:worker_threads';

// Loaded into every Node process of a timed bench build
// (NODE_OPTIONS=--import, see createBuildEnv), so neither side's code changes.
// At exit each process appends one JSON line to the file named by
// LOWDEFY_BENCH_PROBE_FILE: its argv, pid, start and end time (ms since the
// epoch), exit code, peak memory (process.resourceUsage().maxRSS, in KB) and
// CPU time (its userCPUTime and systemCPUTime, in microseconds), which other
// load on the machine changes far less than wall time.
// One line per process: a worker thread shares its process's pid and memory,
// so only the main thread writes.
if (isMainThread) {
  const probeFile = process.env.LOWDEFY_BENCH_PROBE_FILE;
  process.on('exit', (exitCode) => {
    const usage = process.resourceUsage();
    const record = {
      argv: process.argv,
      pid: process.pid,
      start: performance.timeOrigin,
      end: performance.timeOrigin + performance.now(),
      exitCode,
      maxRssKb: usage.maxRSS,
      userCpuUs: usage.userCPUTime,
      systemCpuUs: usage.systemCPUTime,
    };
    fs.appendFileSync(probeFile, JSON.stringify(record) + '\n');
  });
}
