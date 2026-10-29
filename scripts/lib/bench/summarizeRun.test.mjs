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

import assert from 'node:assert/strict';
import path from 'node:path';
import { test } from 'node:test';

import readProbeFile from './readProbeFile.mjs';
import summarizeRun from './summarizeRun.mjs';

// Recorded from a bench build, with a second config pass and a dependency's
// install script added, as a build that installs plugins between passes has.
const records = readProbeFile({
  probeFile: path.join(import.meta.dirname, 'fixtures/probe-two-passes.jsonl'),
});

test('summarizeRun counts each lowdefy/build.mjs process as a config pass', () => {
  const summary = summarizeRun({ records });
  assert.equal(summary.passCount, 2);
  assert.deepEqual(summary.passes, [
    { pid: 84233, wallMs: 31420, maxRssKb: 1605328, exitCode: 0 },
    { pid: 84390, wallMs: 28000, maxRssKb: 1702112, exitCode: 0 },
  ]);
  assert.equal(summary.passesMs, 59420);
});

test('summarizeRun takes the total from the first start to the last end', () => {
  assert.equal(summarizeRun({ records }).totalMs, 67300);
});

test('summarizeRun takes peak memory from the config passes only', () => {
  assert.equal(summarizeRun({ records }).peakRssKb, 1702112);
});

test('summarizeRun throws when no config pass was recorded', () => {
  const cliOnly = records.filter((record) => record.pid === 84084);
  assert.throws(() => summarizeRun({ records: cliOnly }), /no config pass/);
});
