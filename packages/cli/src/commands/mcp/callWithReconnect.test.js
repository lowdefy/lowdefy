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

import { jest } from '@jest/globals';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import callWithReconnect from './callWithReconnect.js';

test('callWithReconnect calls once more on a fresh connection when the call fails', async () => {
  const call = jest
    .fn()
    .mockRejectedValueOnce(new Error('fetch failed'))
    .mockResolvedValueOnce({ content: [] });
  const reconnect = jest.fn(async () => {});
  await expect(callWithReconnect({ call, reconnect })).resolves.toEqual({ content: [] });
  expect(reconnect).toHaveBeenCalledTimes(1);
  expect(call).toHaveBeenCalledTimes(2);
});

test('callWithReconnect does not repeat a call that timed out', async () => {
  const call = jest
    .fn()
    .mockRejectedValue(new McpError(ErrorCode.RequestTimeout, 'Request timed out'));
  const reconnect = jest.fn(async () => {});
  await expect(callWithReconnect({ call, reconnect })).rejects.toThrow('Request timed out');
  expect(call).toHaveBeenCalledTimes(1);
  expect(reconnect).not.toHaveBeenCalled();
});
