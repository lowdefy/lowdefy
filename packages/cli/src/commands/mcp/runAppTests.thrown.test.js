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

import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import runAppTests from './runAppTests.js';

vi.mock('../hub/readMemoryPressure.js', () => ({ default: () => 'normal' }));

// A runner bug: every journey's run throws the same error.
const runnerBug = new Error('cannot read properties of undefined');
vi.mock('../test/runRepeated.js', () => ({
  default: async () => {
    throw runnerBug;
  },
}));

let configDirectory;
let server;
let url;

beforeEach(async () => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-tests-thrown-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  server = http.createServer((req, res) => {
    req.resume();
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ buildId: 'build-1' }));
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  server.close();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

test('runAppTests keeps a thrown run stack in the result file and out of the answer entries', async () => {
  ['a', 'b'].forEach((name) =>
    fs.writeFileSync(
      path.join(configDirectory, 'tests', 'journeys', `${name}.yaml`),
      JSON.stringify({ name, pageId: 'orders', steps: [{ wait: { ms: 1 } }] })
    )
  );

  const answer = await runAppTests({ configDirectory, url });

  const written = JSON.parse(fs.readFileSync(answer.resultFile, 'utf8'));
  expect(written.results.map((result) => result.stack)).toEqual([runnerBug.stack, runnerBug.stack]);
  expect(answer.failed.map((result) => result.name)).toEqual(['a', 'b']);
  answer.failed.forEach((result) => expect(result).not.toHaveProperty('stack'));
  expect(answer.failed[0].report).toContain('      stack:');
  expect(answer.failed[1].report).toContain('      stack: as printed above');
});
