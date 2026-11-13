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

import createProgressSender from './createProgressSender.js';
import { expect, test, vi } from 'vitest';

test('createProgressSender sends a progress notification carrying the call token', async () => {
  const sendNotification = vi.fn();
  const sendProgress = createProgressSender({
    request: { params: { _meta: { progressToken: 'token-1' } } },
    extra: { sendNotification },
  });

  await sendProgress({ progress: 2, total: 5, message: 'PASS orders list' });

  expect(sendNotification).toHaveBeenCalledWith({
    method: 'notifications/progress',
    params: { progressToken: 'token-1', progress: 2, total: 5, message: 'PASS orders list' },
  });
});

test('createProgressSender sends nothing when the call has no progress token', async () => {
  const sendNotification = vi.fn();
  const sendProgress = createProgressSender({
    request: { params: {} },
    extra: { sendNotification },
  });

  await sendProgress({ progress: 1, total: 1, message: 'PASS orders list' });

  expect(sendNotification).not.toHaveBeenCalled();
});

test('createProgressSender keeps going when the client can no longer be reached', async () => {
  const sendProgress = createProgressSender({
    request: { params: { _meta: { progressToken: 0 } } },
    extra: { sendNotification: vi.fn().mockRejectedValue(new Error('Not connected')) },
  });

  await expect(
    sendProgress({ progress: 1, total: 1, message: 'PASS orders list' })
  ).resolves.toBeUndefined();
});
