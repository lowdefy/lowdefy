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

import { vi, expect, test } from 'vitest';

const mockSpawn = vi.fn();
vi.doMock('child_process', () => ({ spawn: mockSpawn, spawnSync: vi.fn() }));

// A file of its own: installHeadlessShell keeps its one install per process
// in module state.
const mockLogger = { info: vi.fn(), warn: vi.fn() };
vi.doMock('../server/log/createLogger.js', () => ({ default: () => mockLogger }));

const { default: installHeadlessShell } = await import('./installHeadlessShell.js');

test('installHeadlessShell logs a failed install once and does not retry it in this process', async () => {
  const warn = mockLogger.warn;
  warn.mockClear();
  mockLogger.info.mockClear();
  const installer = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
  mockSpawn.mockReturnValue(installer);

  const install = installHeadlessShell();
  installer.stderr.emit('data', Buffer.from('Download failed: server returned code 503'));
  installer.emit('exit', 1);
  // An error event after exit (or before it) must not log twice.
  installer.emit('error', new Error('spawn EPIPE'));

  expect(await install).toMatchObject({ installed: false });
  expect(installHeadlessShell()).toBe(install);
  expect(mockSpawn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('Download failed: server returned code 503');
});
