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
import { StreamableHTTPError } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';

import callWithReconnect from './callWithReconnect.js';

test.each([
  ['the session is gone after a restart', new StreamableHTTPError(404, 'Session not found')],
  ['the dev server could not be reached', new TypeError('fetch failed')],
])('callWithReconnect calls once more on a fresh connection when %s', async (_, error) => {
  const call = jest.fn().mockRejectedValueOnce(error).mockResolvedValueOnce({ content: [] });
  const reconnect = jest.fn(async () => {});
  await expect(callWithReconnect({ call, reconnect })).resolves.toEqual({ content: [] });
  expect(reconnect).toHaveBeenCalledTimes(1);
  expect(call).toHaveBeenCalledTimes(2);
});

test.each([
  ['timed out', new McpError(ErrorCode.RequestTimeout, 'Request timed out')],
  ['failed in the server', new McpError(ErrorCode.InternalError, 'Journey step failed')],
])('callWithReconnect does not repeat a call that %s', async (_, error) => {
  const call = jest.fn().mockRejectedValue(error);
  const reconnect = jest.fn(async () => {});
  await expect(callWithReconnect({ call, reconnect })).rejects.toBe(error);
  expect(call).toHaveBeenCalledTimes(1);
  expect(reconnect).not.toHaveBeenCalled();
});
