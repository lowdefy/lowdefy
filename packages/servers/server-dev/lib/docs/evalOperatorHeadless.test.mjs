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
import { jest } from '@jest/globals';

// A real headless evaluation needs an installed browser, which jest can't
// rely on, so this only covers the error paths: bad input, and
// chromium.launch failing (the "no browser installed" case). Mirrors
// screenshotPage.test.mjs, which exercises the same getBrowser.js singleton.
jest.unstable_mockModule('playwright-core', () => ({
  chromium: { launch: jest.fn().mockRejectedValue(new Error("Executable doesn't exist")) },
}));

// lib/build/config.js reads build/config.json from process.cwd() at import
// time — chdir into a fixture that has one before getBrowser.js (which
// imports it transitively) is loaded. Mirrors the pattern in
// screenshotPage.test.mjs.
const originalCwd = process.cwd();
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-eval-operator-test-'));
fs.mkdirSync(path.join(fixtureDir, 'build'), { recursive: true });
fs.writeFileSync(path.join(fixtureDir, 'build', 'config.json'), JSON.stringify({ basePath: '' }));
process.chdir(fixtureDir);

const { default: evalOperatorHeadless } = await import('./evalOperatorHeadless.js');

afterAll(() => {
  process.chdir(originalCwd);
  fs.rmSync(fixtureDir, { recursive: true, force: true });
});

test('evalOperatorHeadless returns an error when origin is missing', async () => {
  const result = await evalOperatorHeadless({ pageId: 'home', expression: { _state: 'x' } });
  expect(result.error).toMatch(/requires an "origin" string/);
});

test('evalOperatorHeadless returns an error when pageId is missing', async () => {
  const result = await evalOperatorHeadless({
    origin: 'http://localhost:3001',
    expression: { _state: 'x' },
  });
  expect(result.error).toMatch(/requires a "pageId" string/);
});

test('evalOperatorHeadless returns an error when expression is missing', async () => {
  const result = await evalOperatorHeadless({ origin: 'http://localhost:3001', pageId: 'home' });
  expect(result.error).toMatch(/requires an "expression"/);
});

test('evalOperatorHeadless returns an actionable error when no browser is available', async () => {
  const result = await evalOperatorHeadless({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression: { _state: 'x' },
  });
  expect(result.error).toMatch(/No Chromium available. Run: npx playwright install chromium/);
});
