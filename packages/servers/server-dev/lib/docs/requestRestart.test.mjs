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
import os from 'os';
import path from 'path';

const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-request-restart-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
process.chdir(fixtureDir);

const { default: requestRestart } = await import('./requestRestart.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('requestRestart writes the .restart sentinel with the reason and a timestamp', () => {
  const result = requestRestart({ reason: 'Added a server operator' });

  expect(result).toEqual({ requested: true, reason: 'Added a server operator' });
  const sentinel = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'build', '.restart'), 'utf8'));
  expect(sentinel.reason).toBe('Added a server operator');
  expect(new Date(sentinel.requestedAt).toISOString()).toBe(sentinel.requestedAt);
});

test('requestRestart writes the sentinel without a reason', () => {
  const result = requestRestart({ reason: undefined });

  expect(result).toEqual({ requested: true, reason: undefined });
  const sentinel = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'build', '.restart'), 'utf8'));
  expect(sentinel).not.toHaveProperty('reason');
  expect(sentinel.requestedAt).toEqual(expect.any(String));
});
