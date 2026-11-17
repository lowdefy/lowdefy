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

import { expect, test, vi } from 'vitest';

vi.doMock('../endpoints/invokeEndpoint.js', () => ({
  default: vi.fn(async (context) => ({
    status: 'return',
    response: null,
    signalAtCall: context.signal,
  })),
}));

const { default: runAfterToolCall } = await import('./runAfterToolCall.js');
const { default: invokeEndpoint } = await import('../endpoints/invokeEndpoint.js');

// The hook records a tool call that already ran (an audit trail): the agent hanging up or the
// request timing out must not stop it.
test('runs the hook with no request signal, even once the request was cancelled', async () => {
  const controller = new AbortController();
  controller.abort(new DOMException('The client closed the connection.', 'AbortError'));
  const context = {
    logger: { warn: vi.fn() },
    signal: controller.signal,
    handleError: vi.fn(),
  };
  await runAfterToolCall(context, { hookId: 'audit', payload: { tool: 'search' } });
  expect(invokeEndpoint).toHaveBeenCalledTimes(1);
  expect(invokeEndpoint.mock.calls[0][0].signal).toBeUndefined();
  expect(context.logger.warn).not.toHaveBeenCalled();
});
