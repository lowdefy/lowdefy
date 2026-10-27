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

import { vi, expect, test } from 'vitest';

const mockReadDevInstance = vi.fn();
vi.doMock('@lowdefy/node-utils', () => ({ readDevInstance: mockReadDevInstance }));

const { default: waitForDevServerReady } = await import('./waitForDevServerReady.js');

const context = { directories: { config: '/app' } };

test('waitForDevServerReady resolves with the instance once the dev server is ready', async () => {
  mockReadDevInstance
    .mockReturnValueOnce(null)
    .mockReturnValueOnce({ state: 'starting' })
    .mockReturnValue({ state: 'ready', url: 'http://localhost:3000', port: 3000 });
  const server = new Promise(() => {});
  expect(await waitForDevServerReady({ context, server, intervalMs: 1 })).toEqual({
    state: 'ready',
    url: 'http://localhost:3000',
    port: 3000,
  });
  expect(mockReadDevInstance).toHaveBeenCalledWith({ configDirectory: '/app' });
});

test('waitForDevServerReady resolves with null when the dev server exits first', async () => {
  mockReadDevInstance.mockReturnValue(null);
  const server = Promise.reject(new Error('Server exited with code 1.'));
  expect(await waitForDevServerReady({ context, server, intervalMs: 1 })).toBe(null);
});
