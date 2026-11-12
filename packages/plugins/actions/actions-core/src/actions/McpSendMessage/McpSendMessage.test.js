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

import McpSendMessage from './McpSendMessage.js';

test('McpSendMessage sends the text through the mcpSendMessage method', async () => {
  const mcpSendMessage = vi.fn(async () => undefined);
  const result = await McpSendMessage({
    methods: { mcpSendMessage },
    params: { text: 'Show me ticket 12' },
  });
  expect(mcpSendMessage.mock.calls).toEqual([[{ text: 'Show me ticket 12' }]]);
  expect(result).toBe(undefined);
});

test('McpSendMessage rejects when the mcpSendMessage method fails', async () => {
  const mcpSendMessage = vi.fn(async () => {
    throw new Error('The MCP host refused the message.');
  });
  await expect(
    McpSendMessage({ methods: { mcpSendMessage }, params: { text: 'Hello' } })
  ).rejects.toThrow('The MCP host refused the message.');
});

test('McpSendMessage throws when params is not an object', async () => {
  const mcpSendMessage = vi.fn();
  await expect(McpSendMessage({ methods: { mcpSendMessage }, params: 'Hello' })).rejects.toThrow(
    'McpSendMessage params must be an object.'
  );
  await expect(McpSendMessage({ methods: { mcpSendMessage } })).rejects.toThrow(
    'McpSendMessage params must be an object.'
  );
  expect(mcpSendMessage).not.toHaveBeenCalled();
});

test('McpSendMessage throws when text is missing, empty or not a string', async () => {
  const mcpSendMessage = vi.fn();
  const message = 'McpSendMessage requires a "text" string.';
  await expect(McpSendMessage({ methods: { mcpSendMessage }, params: {} })).rejects.toThrow(
    message
  );
  await expect(
    McpSendMessage({ methods: { mcpSendMessage }, params: { text: '' } })
  ).rejects.toThrow(message);
  await expect(
    McpSendMessage({ methods: { mcpSendMessage }, params: { text: 12 } })
  ).rejects.toThrow(message);
  expect(mcpSendMessage).not.toHaveBeenCalled();
});
