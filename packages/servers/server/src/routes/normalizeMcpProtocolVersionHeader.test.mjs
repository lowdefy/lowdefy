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

import { Hono } from 'hono';

import normalizeMcpProtocolVersionHeader from './normalizeMcpProtocolVersionHeader.js';

function createApp() {
  const app = new Hono();
  app.post('/api/mcp', (c) => {
    normalizeMcpProtocolVersionHeader({ request: c.req.raw });
    return c.json({ protocolVersion: c.req.header('mcp-protocol-version') ?? null });
  });
  return app;
}

async function send(headerValue) {
  const headers = new Headers();
  if (headerValue !== undefined) {
    headers.set('mcp-protocol-version', headerValue);
  }
  const res = await createApp().request('/api/mcp', { method: 'POST', headers });
  return (await res.json()).protocolVersion;
}

test('collapses a repeated protocol version to the single version it names', async () => {
  expect(await send('2025-11-25, 2025-11-25')).toEqual('2025-11-25');
});

test('collapses the value the Fetch Headers constructor builds from both header spellings', async () => {
  const headers = new Headers({
    'mcp-protocol-version': '2025-11-25',
    'MCP-Protocol-Version': '2025-11-25',
  });
  const res = await createApp().request('/api/mcp', { method: 'POST', headers });
  expect((await res.json()).protocolVersion).toEqual('2025-11-25');
});

test('leaves a single protocol version untouched', async () => {
  expect(await send('2025-06-18')).toEqual('2025-06-18');
});

test('leaves a header naming two different versions for the transport to refuse', async () => {
  expect(await send('2025-11-25, 2025-06-18')).toEqual('2025-11-25, 2025-06-18');
});

test('leaves an absent header absent', async () => {
  expect(await send(undefined)).toEqual(null);
});
