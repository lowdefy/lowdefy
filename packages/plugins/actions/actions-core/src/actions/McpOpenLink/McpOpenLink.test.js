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

import McpOpenLink from './McpOpenLink.js';

test('McpOpenLink passes a url to the mcpOpenLink method', async () => {
  const mcpOpenLink = vi.fn(async () => undefined);
  const result = await McpOpenLink({
    methods: { mcpOpenLink },
    params: { url: 'https://example.com/docs', urlQuery: { tab: 'notes' } },
  });
  expect(mcpOpenLink.mock.calls).toEqual([
    [
      {
        home: undefined,
        pageId: undefined,
        pathParams: undefined,
        url: 'https://example.com/docs',
        urlQuery: { tab: 'notes' },
      },
    ],
  ]);
  expect(result).toBe(undefined);
});

test('McpOpenLink passes a page target to the mcpOpenLink method', async () => {
  const mcpOpenLink = vi.fn(async () => undefined);
  await McpOpenLink({
    methods: { mcpOpenLink },
    params: { pageId: 'ticket', pathParams: { ticket_id: 12 }, newTab: true },
  });
  expect(mcpOpenLink.mock.calls).toEqual([
    [
      {
        home: undefined,
        pageId: 'ticket',
        pathParams: { ticket_id: 12 },
        url: undefined,
        urlQuery: undefined,
      },
    ],
  ]);
});

test('McpOpenLink rejects when the mcpOpenLink method fails', async () => {
  const mcpOpenLink = vi.fn(async () => {
    throw new Error('The MCP host refused to open the link.');
  });
  await expect(
    McpOpenLink({ methods: { mcpOpenLink }, params: { url: 'https://example.com' } })
  ).rejects.toThrow('The MCP host refused to open the link.');
});

test('McpOpenLink throws when params is not an object', async () => {
  const mcpOpenLink = vi.fn();
  await expect(
    McpOpenLink({ methods: { mcpOpenLink }, params: 'https://example.com' })
  ).rejects.toThrow('McpOpenLink params must be an object.');
  await expect(McpOpenLink({ methods: { mcpOpenLink } })).rejects.toThrow(
    'McpOpenLink params must be an object.'
  );
  expect(mcpOpenLink).not.toHaveBeenCalled();
});
