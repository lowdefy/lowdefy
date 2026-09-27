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

import shutdownServer from './shutdownServer.mjs';

test('shutdownServer records when the stopped child has exited, for the proxy to wait on', async () => {
  const child = Object.assign(new EventEmitter(), {
    exitCode: null,
    signalCode: null,
    killed: false,
    kill: jest.fn(),
  });
  const context = { devServer: child, logger: { debug: jest.fn(), info: jest.fn() } };

  shutdownServer(context)();

  expect(child.kill).toHaveBeenCalledTimes(1);
  expect(context.devServer).toBe(null);
  let exited = false;
  context.devServerExited.then(() => {
    exited = true;
  });
  await Promise.resolve();
  expect(exited).toBe(false);
  child.emit('exit', null, 'SIGTERM');
  await context.devServerExited;
  expect(exited).toBe(true);
});
