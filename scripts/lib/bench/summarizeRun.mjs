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

import path from 'node:path';

// A config pass is a process running the server's Lowdefy build script,
// lowdefy/build.mjs, which the CLI starts through `pnpm run build:lowdefy`.
function isConfigPass(record) {
  const script = record.argv[1] ?? '';
  return path.basename(script) === 'build.mjs' && path.basename(path.dirname(script)) === 'lowdefy';
}

// One build's numbers from its probe records:
// - passes: each config pass in start order, { pid, wallMs, maxRssKb, exitCode };
// - passCount and passesMs, the passes' wall time summed;
// - totalMs: from the first process's start to the last one's end, the whole
//   `lowdefy build`, installs included;
// - peakRssKb: the largest maxRSS of the config passes.
function summarizeRun({ records }) {
  if (records.length === 0) {
    throw new Error('The probe recorded no process.');
  }
  const passes = records
    .filter(isConfigPass)
    .sort((a, b) => a.start - b.start)
    .map((record) => ({
      pid: record.pid,
      wallMs: record.end - record.start,
      maxRssKb: record.maxRssKb,
      exitCode: record.exitCode,
    }));
  if (passes.length === 0) {
    throw new Error('The probe recorded no config pass (lowdefy/build.mjs).');
  }
  const start = Math.min(...records.map((record) => record.start));
  const end = Math.max(...records.map((record) => record.end));
  return {
    passes,
    passCount: passes.length,
    passesMs: passes.reduce((sum, pass) => sum + pass.wallMs, 0),
    totalMs: end - start,
    peakRssKb: Math.max(...passes.map((pass) => pass.maxRssKb)),
  };
}

export default summarizeRun;
