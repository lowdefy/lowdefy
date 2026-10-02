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

import { EventEmitter } from 'node:events';

import { jest } from '@jest/globals';

const mockSpawn = jest.fn();
jest.unstable_mockModule('child_process', () => ({ spawn: mockSpawn }));

// installHeadlessShell keeps one install per process in module state, so the
// tests below run in order against one module: the skipped calls first, then
// the one install. The failure path is in installHeadlessShell.failure.test.mjs.
const { default: installHeadlessShell } = await import('./installHeadlessShell.js');

function createInstaller() {
  return Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
}

beforeEach(() => {
  jest.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  delete process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
});

test.each(['1', 'true'])(
  'installHeadlessShell installs nothing when PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD is %s',
  (value) => {
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = value;

    expect(installHeadlessShell()).toBeNull();
    expect(mockSpawn).not.toHaveBeenCalled();
  }
);

test("installHeadlessShell runs playwright-core's own installer once per process, however many calls arrive", async () => {
  // Playwright reads "0" and "false" as unset.
  process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = 'false';
  const installer = createInstaller();
  mockSpawn.mockReturnValue(installer);

  const first = installHeadlessShell();
  const second = installHeadlessShell();
  installer.emit('exit', 0);

  expect(await first).toBe(true);
  expect(second).toBe(first);
  expect(installHeadlessShell()).toBe(first);
  expect(mockSpawn).toHaveBeenCalledTimes(1);
  const [command, args] = mockSpawn.mock.calls[0];
  expect(command).toBe(process.execPath);
  expect(args[0]).toMatch(/playwright-core[/\\]cli\.js$/);
  expect(args.slice(1)).toEqual(['install', 'chromium-headless-shell']);
});
