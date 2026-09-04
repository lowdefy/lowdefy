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

// A GET stream can go away without firing onclose and without its request
// signal aborting, and the transport's send returns silently when no stream is
// open — so the bus never learns and the subscription, with its McpServer,
// lives forever while every reconnect adds another. Bound it: an agent holds
// one stream at a time, so a handful covers every legitimate client, and the
// oldest is dropped when a new one arrives beyond that.
const MAX_EVENT_STREAMS = 4;

const eventStreams = new Set();

// Set.delete answers whether it was still registered, which makes this
// idempotent: onclose and abort both fire for a normal disconnect, and an
// evicted stream fires them afterwards.
function dropEventStream(stream) {
  if (eventStreams.delete(stream) === false) {
    return;
  }
  stream.unsubscribe();
}

function pruneEventStreams() {
  eventStreams.forEach((stream) => {
    if (stream.signal?.aborted === true) {
      dropEventStream(stream);
    }
  });
  while (eventStreams.size >= MAX_EVENT_STREAMS) {
    dropEventStream(eventStreams.values().next().value);
  }
}

async function mcpHandler(c) {
  const server = createDocsMcpServer({ origin: new URL(c.req.url).origin, honoContext: c });
  const transport = new StreamableHTTPTransport();
  await server.connect(transport);
  if (c.req.method !== 'GET') {
    return transport.handleRequest(c);
  }

  pruneEventStreams();
  const stream = { signal: c.req.raw.signal, unsubscribe: subscribeMcpServerToDevEvents(server) };
  eventStreams.add(stream);
  // Three unsubscribe paths: an explicit close, a dropped connection, and the
  // eviction above for a stream that fired neither.
  const stop = () => dropEventStream(stream);
  server.server.onclose = stop;
  c.req.raw.signal?.addEventListener('abort', stop, { once: true });

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
