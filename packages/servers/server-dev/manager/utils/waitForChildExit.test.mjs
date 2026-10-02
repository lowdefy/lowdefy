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

import waitForChildExit from './waitForChildExit.mjs';

function createChild({ exitOn = [] } = {}) {
  const child = Object.assign(new EventEmitter(), {
    exitCode: null,
    signalCode: null,
    kill: jest.fn((signal) => {
      if (exitOn.includes(signal)) {
        setImmediate(() => {
          child.signalCode = signal;
          child.emit('exit', null, signal);
        });
      }
    }),
  });
  return child;
}

test('waitForChildExit resolves at once when there is no child', async () => {
  await expect(waitForChildExit({ child: null })).resolves.toBe(true);
});

test('waitForChildExit resolves at once when the child has already exited', async () => {
  const child = createChild();
  child.exitCode = 0;
  await expect(waitForChildExit({ child, timeoutMs: 1000 })).resolves.toBe(true);
  expect(child.kill).not.toHaveBeenCalled();
});

test('waitForChildExit resolves when the child exits within the timeout, without SIGKILL', async () => {
  const child = createChild();
  const waiting = waitForChildExit({ child, timeoutMs: 1000, killTimeoutMs: 1000 });
  child.exitCode = 0;
  child.emit('exit', 0, null);
  await expect(waiting).resolves.toBe(true);
  expect(child.kill).not.toHaveBeenCalled();
});

test('waitForChildExit SIGKILLs a child that ignores SIGTERM and resolves once it exits', async () => {
  const child = createChild({ exitOn: ['SIGKILL'] });
  await expect(waitForChildExit({ child, timeoutMs: 10, killTimeoutMs: 1000 })).resolves.toBe(true);
  expect(child.kill).toHaveBeenCalledWith('SIGKILL');
});

test('waitForChildExit resolves false after both timeouts when the child never exits', async () => {
  const child = createChild();
  await expect(waitForChildExit({ child, timeoutMs: 10, killTimeoutMs: 10 })).resolves.toBe(false);
  expect(child.kill).toHaveBeenCalledWith('SIGKILL');
  expect(child.listenerCount('exit')).toBe(0);
});
