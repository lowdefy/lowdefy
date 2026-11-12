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

import { vi } from 'vitest';

// The object a view's loader hands the client entry (window.__LOWDEFY_VIEW__),
// over a fake MCP Apps host. tokens are the session tokens the host's
// lowdefy_view_session calls answer with, in order.
function createFakeViewLoader({
  basePath = '',
  origin = 'https://app.example.com',
  path = '/tickets/12?tab=notes',
  tokens = ['token-1', 'token-2', 'token-3'],
} = {}) {
  const remaining = [...tokens];
  let context = { displayMode: 'inline' };
  const contextListeners = new Set();
  return {
    version: 1,
    origin,
    basePath,
    boot: { buildId: 'build-1', js: `${basePath}/assets/view-1.js`, css: [] },
    toolInput: { arguments: { key: '12' } },
    toolResult: {
      content: [{ type: 'text', text: 'Ticket 12' }],
      _meta: { 'lowdefy/view': { path } },
    },
    host: {
      info: { name: 'fake-host', version: '1' },
      capabilities: {},
      getContext: () => context,
      onContextChange: (listener) => {
        contextListeners.add(listener);
        return () => contextListeners.delete(listener);
      },
      callServerTool: vi.fn(async ({ name }) => {
        if (name !== 'lowdefy_view_session') {
          return { content: [] };
        }
        if (remaining.length === 0) {
          return { isError: true, content: [{ type: 'text', text: 'No session for you.' }] };
        }
        return {
          content: [],
          _meta: {
            'lowdefy/viewSession': {
              token: remaining.shift(),
              expiresAt: '2026-01-01T00:15:00.000Z',
            },
          },
        };
      }),
      openLink: vi.fn(async () => ({})),
      sendMessage: vi.fn(async () => ({})),
    },
    setContext: (next) => {
      context = next;
      contextListeners.forEach((listener) => listener(context));
    },
    showFallback: vi.fn(),
  };
}

export default createFakeViewLoader;
