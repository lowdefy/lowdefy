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
const mockSpawnSync = jest.fn();
jest.unstable_mockModule('child_process', () => ({ spawn: mockSpawn, spawnSync: mockSpawnSync }));

// A file of its own: installHeadlessShell keeps its one install per process
// in module state.
const { default: installHeadlessShell } = await import('./installHeadlessShell.js');

test('installHeadlessShell kills an install that has not finished within 3 minutes and gives up', async () => {
  // performance is not redefinable on this Node, and nothing here reads it.
  jest.useFakeTimers({ doNotFake: ['performance'] });
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'info').mockImplementation(() => {});
  try {
    const installer = Object.assign(new EventEmitter(), {
      pid: 4242,
      stderr: new EventEmitter(),
      kill: jest.fn(),
    });
    mockSpawn.mockReturnValue(installer);

    const install = installHeadlessShell();
    jest.advanceTimersByTime(3 * 60 * 1000 - 1);
    expect(installer.kill).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);

    const result = await install;
    expect(result.installed).toBe(false);
    expect(result.reason).toContain('did not finish within 3 minutes');
    if (process.platform === 'win32') {
      // taskkill /T stops the installer and its download process together.
      expect(mockSpawnSync).toHaveBeenCalledWith('taskkill', ['/pid', '4242', '/T', '/F'], {
        stdio: 'ignore',
      });
    } else {
      // The installer's own download process goes too.
      expect(mockSpawnSync).toHaveBeenCalledWith('pkill', ['-KILL', '-P', '4242'], {
        stdio: 'ignore',
      });
      expect(installer.kill).toHaveBeenCalledWith('SIGKILL');
    }
    expect(warn).toHaveBeenCalledTimes(1);
    // The exit that follows the kill does not log again, and nothing retries.
    installer.emit('exit', null, 'SIGKILL');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(installHeadlessShell()).toBe(install);
    expect(mockSpawn).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
    jest.restoreAllMocks();
  }
});
