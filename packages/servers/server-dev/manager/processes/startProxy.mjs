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

import { BUILD_WAIT_HEADER } from '../../lib/docs/readProxyBuildWait.js';
import readBuildStatusWait from '../utils/readBuildStatusWait.mjs';

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

A child is probed until it answers once; after that, requests go straight to
it for as long as that child process lives. Probing every request opened (and
closed) one extra TCP connection per request, and a Vite page load is hundreds
of module requests: each closed probe sits in TIME_WAIT, and a few dozen page
loads within half a minute ran the machine out of ephemeral ports, failing
unrelated connections. A proxied request that cannot reach the child, a child
that exits, or a new child after a restart sends requests back through the
probe and its hold. A restart first waits for the stopped child to exit, since
until then it still answers the probe. A GET or HEAD that never reached the
child (a refused connect, or a keep-alive socket the dying child had closed)
is replayed through the hold rather than answered 502: a child can close its
sockets before the manager sees it exit.
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

async function waitForChild({ port, deadline }) {
  for (;;) {
    if (await probeChild(port)) return true;
    if (Date.now() > deadline) return false;
    await new Promise((resolve) => setTimeout(resolve, RETRY_MS));
  }
}

function isConfirmedChild({ context, proxyState }) {
  const child = context.devServer;
  return (
    Boolean(child) &&
    child === proxyState.confirmedChild &&
    child.exitCode === null &&
    child.signalCode === null
  );
}

function waitUntil({ promise, deadline }) {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(resolve, Math.max(0, deadline - Date.now()))),
  ]);
}

async function waitForConfirmedChild({ context, proxyState, deadline }) {
  if (isConfirmedChild({ context, proxyState })) {
    return true;
  }
  await waitUntil({ promise: context.devServerExited, deadline });
  const child = context.devServer;
  const up = await waitForChild({ port: context.internalPort, deadline });
  if (up) {
    proxyState.confirmedChild = child;
  }
  return up;
}

const REPLAYABLE_METHODS = ['GET', 'HEAD'];

// Nothing reached the child: the connect was refused, or the keep-alive socket
// the agent reused had already been closed by a child that is going away.
function isUnsentError({ error, proxyReq }) {
  return (
    error.code === 'ECONNREFUSED' || (proxyReq.reusedSocket === true && error.code === 'ECONNRESET')
  );
}

function forwardRequest({ body, context, proxyState }, req, res, deadline = Date.now() + HOLD_MS) {
  // Wait for a live child BEFORE piping the request body — the body stream can
  // only be consumed once, so retrying after a failed proxy request would need
  // full-body buffering. Only a bodiless GET or HEAD that never reached the
  // child is replayed; any other request that loses the child mid-forward
  // surfaces as one 502, which the client's next attempt resolves through the
  // hold.
  waitForConfirmedChild({ context, proxyState, deadline }).then((up) => {
    // The response, not the request: an incoming request reads as destroyed
    // once its body has been read, which a replayed GET's has.
    if (res.destroyed) return;
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
    proxyReq.on('error', (error) => {
      proxyState.confirmedChild = null;
      if (
        !res.headersSent &&
        REPLAYABLE_METHODS.includes(req.method) &&
        isUnsentError({ error, proxyReq })
      ) {
        forwardRequest({ body, context, proxyState }, req, res, deadline);
        return;
      }
      if (res.headersSent) {
        res.destroy();
        return;
      }
      res.writeHead(502, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Lowdefy dev server connection dropped.' }));
    });
    // A body read to recognise a build-status wait is sent as read. A
    // replayed GET's request stream has already ended, so there is nothing
    // left to pipe.
    if (body !== undefined) {
      proxyReq.end(body);
    } else if (req.readableEnded) {
      proxyReq.end();
    } else {
      req.pipe(proxyReq);
    }
    req.on('error', () => proxyReq.destroy());
    // A client that goes away mid-response (a closed browser tab holding the
    // reload SSE stream, an agent dropping its MCP stream) must reach the
    // child as an aborted request — pipe() only unpipes, so without this the
    // child keeps the stream open and, for SSE, its tab registered forever.
    res.on('close', () => {
      if (!res.writableFinished) proxyReq.destroy();
    });
  });
}

// A build-status wait is held here until the manager has processed the
// latest edits, restarts included, and only then forwarded: a restart ends
// the dev server process, and any wait running in it. The header tells the
// dev server what this wait saw, so it does not wait again.
async function handleRequest({ context, proxyState }, req, res) {
  delete req.headers[BUILD_WAIT_HEADER];
  const { wait, body } = await readBuildStatusWait({ basePath: context.basePath, req });
  if (wait) {
    const waited = await context.buildActivity.waitForIdle();
    req.headers[BUILD_WAIT_HEADER] = new URLSearchParams({
      settled: String(waited.settled),
      sawBuild: String(waited.sawBuild),
      waitedMs: String(waited.waitedMs),
    }).toString();
  }
  forwardRequest({ body, context, proxyState }, req, res);
}

function forwardUpgrade(context, req, socket, head) {
  waitForChild({ port: context.internalPort, deadline: Date.now() + HOLD_MS }).then((up) => {
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
    upstream.on('close', () => socket.destroy());
    socket.on('close', () => upstream.destroy());
  });
}

function startProxy(context) {
  if (context.proxyServer) return Promise.resolve();
  const proxyState = { confirmedChild: null };
  const proxy = http.createServer((req, res) => {
    // A client that drops an MCP request while its body is read.
    handleRequest({ context, proxyState }, req, res).catch(() => res.destroy());
  });
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
