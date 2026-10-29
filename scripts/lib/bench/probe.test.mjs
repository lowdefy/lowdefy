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
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import createBuildEnv from './createBuildEnv.mjs';
import readProbeFile from './readProbeFile.mjs';

function runProbed(script) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bench-probe-'));
  const probeFile = path.join(directory, 'probe.jsonl');
  const scriptFile = path.join(directory, 'script.mjs');
  fs.writeFileSync(scriptFile, script);
  const result = spawnSync(process.execPath, [scriptFile], {
    env: createBuildEnv({ env: { PATH: process.env.PATH }, probeFile }),
  });
  return {
    cleanup: () => fs.rmSync(directory, { recursive: true }),
    records: readProbeFile({ probeFile }),
    result,
    scriptFile,
  };
}

test('probe records argv, times, exit code and peak memory of a process', () => {
  const before = Date.now();
  const { cleanup, records, result, scriptFile } = runProbed('process.exitCode = 3;\n');
  assert.equal(result.status, 3);
  assert.equal(records.length, 1);
  const [record] = records;
  assert.deepEqual(record.argv, [process.execPath, scriptFile]);
  assert.equal(record.exitCode, 3);
  assert.equal(record.pid, result.pid);
  assert.ok(record.start >= before - 1000 && record.start <= record.end);
  assert.ok(record.end <= Date.now());
  assert.ok(Number.isInteger(record.maxRssKb) && record.maxRssKb > 1000);
  cleanup();
});

test('probe records each child Node process on a line of its own', () => {
  const { cleanup, records } = runProbed(
    "import { execFileSync } from 'node:child_process';\n" +
      "execFileSync(process.execPath, ['-e', '0']);\n"
  );
  assert.equal(records.length, 2);
  assert.deepEqual(records[0].argv, [process.execPath]);
  cleanup();
});

test('probe writes one line for a process with a worker thread', () => {
  const { cleanup, records } = runProbed(
    "import { Worker } from 'node:worker_threads';\n" +
      "await new Promise((resolve) => new Worker('0', { eval: true }).on('exit', resolve));\n"
  );
  assert.equal(records.length, 1);
  cleanup();
});
