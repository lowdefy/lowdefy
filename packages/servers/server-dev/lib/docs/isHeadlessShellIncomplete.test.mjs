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

// Playwright's registry reads PLAYWRIGHT_BROWSERS_PATH when it loads, so it
// is set before the first import.
const browsersPath = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-shell-'));
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

const { registry } = await import('playwright-core/lib/server/registry/index');
const { default: isHeadlessShellIncomplete } = await import('./isHeadlessShellIncomplete.js');

const { directory } = registry.findExecutable('chromium-headless-shell');

afterEach(() => {
  fs.rmSync(directory, { recursive: true, force: true });
});

afterAll(() => {
  fs.rmSync(browsersPath, { recursive: true, force: true });
  delete process.env.PLAYWRIGHT_BROWSERS_PATH;
});

test('the shell directory resolves under PLAYWRIGHT_BROWSERS_PATH', () => {
  expect(path.dirname(directory)).toBe(browsersPath);
});

test('isHeadlessShellIncomplete is false when the shell was never installed', async () => {
  expect(await isHeadlessShellIncomplete()).toBe(false);
});

test('isHeadlessShellIncomplete is true when the executable exists without the INSTALLATION_COMPLETE marker', async () => {
  const executable = registry.findExecutable('chromium-headless-shell').executablePath();
  fs.mkdirSync(path.dirname(executable), { recursive: true });
  fs.writeFileSync(executable, '');

  expect(await isHeadlessShellIncomplete()).toBe(true);
});

test('isHeadlessShellIncomplete is false once the install wrote its marker', async () => {
  const executable = registry.findExecutable('chromium-headless-shell').executablePath();
  fs.mkdirSync(path.dirname(executable), { recursive: true });
  fs.writeFileSync(executable, '');
  fs.writeFileSync(path.join(directory, 'INSTALLATION_COMPLETE'), '');

  expect(await isHeadlessShellIncomplete()).toBe(false);
});
