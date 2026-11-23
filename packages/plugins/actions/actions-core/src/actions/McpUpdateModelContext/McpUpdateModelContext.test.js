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

import McpUpdateModelContext from './McpUpdateModelContext.js';

test('McpUpdateModelContext sends the text through the mcpUpdateModelContext method', async () => {
  const mcpUpdateModelContext = vi.fn(async () => undefined);
  const result = await McpUpdateModelContext({
    methods: { mcpUpdateModelContext },
    params: { text: 'The person renamed step 2 to "Call the client".' },
  });
  expect(mcpUpdateModelContext.mock.calls).toEqual([
    [{ text: 'The person renamed step 2 to "Call the client".' }],
  ]);
  expect(result).toBe(undefined);
});

test('McpUpdateModelContext rejects when the mcpUpdateModelContext method fails', async () => {
  const mcpUpdateModelContext = vi.fn(async () => {
    throw new Error('The MCP host refused the model context.');
  });
  await expect(
    McpUpdateModelContext({ methods: { mcpUpdateModelContext }, params: { text: 'Hello' } })
  ).rejects.toThrow('The MCP host refused the model context.');
});

test('McpUpdateModelContext throws when params is not an object', async () => {
  const mcpUpdateModelContext = vi.fn();
  await expect(
    McpUpdateModelContext({ methods: { mcpUpdateModelContext }, params: 'Hello' })
  ).rejects.toThrow('McpUpdateModelContext params must be an object.');
  await expect(McpUpdateModelContext({ methods: { mcpUpdateModelContext } })).rejects.toThrow(
    'McpUpdateModelContext params must be an object.'
  );
  expect(mcpUpdateModelContext).not.toHaveBeenCalled();
});

test('McpUpdateModelContext throws when text is missing, empty or not a string', async () => {
  const mcpUpdateModelContext = vi.fn();
  const message = 'McpUpdateModelContext requires a "text" string.';
  await expect(
    McpUpdateModelContext({ methods: { mcpUpdateModelContext }, params: {} })
  ).rejects.toThrow(message);
  await expect(
    McpUpdateModelContext({ methods: { mcpUpdateModelContext }, params: { text: '' } })
  ).rejects.toThrow(message);
  await expect(
    McpUpdateModelContext({ methods: { mcpUpdateModelContext }, params: { text: 12 } })
  ).rejects.toThrow(message);
  expect(mcpUpdateModelContext).not.toHaveBeenCalled();
});
