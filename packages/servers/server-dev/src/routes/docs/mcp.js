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

import { StreamableHTTPTransport } from '@hono/mcp';

import createDocsMcpServer, {
  subscribeMcpServerToDevEvents,
} from '../../../lib/docs/createDocsMcpServer.js';
import { bootedAt } from '../../../lib/docs/devEventBus.js';

// Stateless per-request server: docs tools read build artifacts fresh on
// every call, so there is no session state worth keeping between requests.
//
// A GET opens the transport's standalone SSE stream, which is where server →
// client notifications go, so only that request subscribes to dev events. The
// POST path stays stateless — no sessionIdGenerator, no session registry.
async function mcpHandler(c) {
  const server = createDocsMcpServer({ origin: new URL(c.req.url).origin, honoContext: c });
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  if (c.req.method !== 'GET') {
    return transport.handleRequest(c);
  }

  // Three unsubscribe paths: an explicit close, a dropped connection, and (via
  // the bus pruning a send that rejects) a stream gone without either firing.
  const unsubscribe = subscribeMcpServerToDevEvents(server);
  server.server.onclose = unsubscribe;
  c.req.raw.signal?.addEventListener('abort', unsubscribe, { once: true });

  // handleRequest registers the standalone stream synchronously inside
  // streamSSE, so the restart notice must be sent after it — before, the
  // transport has no stream to write to and drops the message silently.
  const response = await transport.handleRequest(c);
  await server.server.sendLoggingMessage({
    level: 'info',
    logger: 'lowdefy',
    data: { type: 'restart', timestamp: new Date().toISOString(), bootedAt },
  });
  return response;
}

export default mcpHandler;
