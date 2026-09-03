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

import http from 'node:http';
import net from 'node:net';

/*
The manager owns the public port; the Vite child listens on an internal
loopback port and every restart replaces only the child. Before this proxy the
child bound the public port directly, so each restart (js module change, .env
change, plugin install) dropped the TCP listener for the whole Vite boot —
long-lived clients (MCP agents on /lowdefy-docs/mcp, the reload SSE stream,
HMR websockets) saw ECONNREFUSED and gave up; coding agents in particular
latch the failure and need a manual reconnect. Holding the listener here turns
a restart into a briefly-slow request instead of a dead port.

While the child is down, requests and upgrades wait for it to come back
(probing every RETRY_MS up to HOLD_MS) rather than failing fast. HOLD_MS
covers a Vite respawn with headroom; a child that stays down longer than that
answers 503 so callers are not held forever. In-flight streams cannot survive
a child exit — those sockets close and the client reconnects into the hold.
*/

const RETRY_MS = 250;
const HOLD_MS = 30000;

function probeChild(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForChild({ port }) {
  const deadline = Date.now() + HOLD_MS;
  for (;;) {
    if (await probeChild(port)) return true;
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
}

function forwardRequest(context, req, res) {
  // Wait for a live child BEFORE piping the request body — the body stream can
  // only be consumed once, so retrying after a failed proxy request would need
  // full-body buffering. A probe-then-forward race (child dies between the
  // probe and the connect) surfaces as one 502, which the client's next
  // attempt resolves through the hold.
  waitForChild({ port: context.internalPort }).then((up) => {
    if (req.destroyed) return;
    if (!up) {
      res.writeHead(503, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Lowdefy dev server is restarting.' }));
      return;
    }
    const proxyReq = http.request({
      host: '127.0.0.1',
      port: context.internalPort,
      method: req.method,
      path: req.url,
      headers: req.headers,
    });
    proxyReq.on('response', (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      // flushHeaders so SSE endpoints (reload stream, MCP notifications)
      // reach the client before the first event.
      res.flushHeaders?.();
      proxyRes.pipe(res);
    });
    proxyReq.on('error', () => {
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Lowdefy dev server connection dropped.' }));
    });
    req.pipe(proxyReq);
    req.on('error', () => proxyReq.destroy());
  });
}

function forwardUpgrade(context, req, socket, head) {
  waitForChild({ port: context.internalPort }).then((up) => {
    if (socket.destroyed) return;
    if (!up) {
      socket.end('HTTP/1.1 503 Service Unavailable\r\nconnection: close\r\n\r\n');
      return;
    }
    const upstream = net.connect({ host: '127.0.0.1', port: context.internalPort }, () => {
      // Replay the upgrade request verbatim (rawHeaders preserves order and
      // case) and splice the sockets — protocol-agnostic, so Vite HMR and app
      // websockets both pass through untouched.
      const lines = [`${req.method} ${req.url} HTTP/1.1`];
      for (let i = 0; i < req.rawHeaders.length; i += 2) {
        lines.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
      }
      upstream.write(lines.join('\r\n') + '\r\n\r\n');
      if (head?.length) upstream.write(head);
      upstream.pipe(socket);
      socket.pipe(upstream);
    });
    upstream.on('error', () => socket.destroy());
    socket.on('error', () => upstream.destroy());
  });
}

function startProxy(context) {
  if (context.proxyServer) return Promise.resolve();
  const proxy = http.createServer((req, res) => forwardRequest(context, req, res));
  proxy.on('upgrade', (req, socket, head) => forwardUpgrade(context, req, socket, head));
  // Long-lived streams (SSE, MCP) must not be reaped by the default 5-minute
  // request timeout; keep the proxy transparent.
  proxy.requestTimeout = 0;
  proxy.headersTimeout = 60000;
  context.proxyServer = proxy;
  return new Promise((resolve, reject) => {
    proxy.once('error', reject);
    // 'localhost' for parity with the Vite default host the child used to bind
    // — the dev server stays loopback-only, not exposed on the LAN.
    proxy.listen(context.options.port, 'localhost', () => {
      proxy.removeListener('error', reject);
      context.logger.debug(
        `Proxy listening on port ${context.options.port}, forwarding to ${context.internalPort}.`
      );
      resolve();
    });
  });
}

export default startProxy;
