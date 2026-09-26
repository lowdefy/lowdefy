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

// The Vercel function entry, written into the Build Output at
// .vercel/output/functions/api.func/<relServer>/api/index.js, where <relServer> is the server
// directory's path relative to the trace base (empty for standalone apps). Kept as a string (not a
// template file) so it ships verbatim — a real source file would be transpiled by the CLI's swc
// build, stripping these comments. Its `../src/app.js` import and the chdir to `..` resolve to the
// server directory inside the function, where the assembly places src/, build/, lib/ and the traced
// dependency closure. Its `ws` and `@hono/node-server` imports resolve because the traced
// src/index.js imports both.
const apiHandler = `/*
  Vercel Serverless Function entry for a Lowdefy (Hono) app — generated into the Vercel Build Output
  by lowdefy vercel-output.

  The built client and public files are served from Vercel's CDN (.vercel/output/static); every
  other request is routed here (config.json routes) and run through the Lowdefy Hono app (page
  rendering, /api/* requests, endpoints, cron, auth, agents).

  Runs on the Node runtime (the app uses fs to read its build). The default export is a Node HTTP
  server, which Vercel's Node runtime serves, WebSocket upgrades included. Ordinary requests go
  through handleRequest: it buffers the request body eagerly and builds a Web Request from it, since
  Vercel's Node runtime does not drain a lazily-read body stream reliably, so a streaming adapter
  (@hono/node-server's request listener) hangs on every request that has a body (POST). Upgrade
  requests (/api/websocket) are handled by @hono/node-server's WebSocket support, which listens for
  the server's upgrade event and runs the Hono app's upgradeWebSocket route.
*/

import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createAdaptorServer } from '@hono/node-server';
import { WebSocketServer } from 'ws';

// The app reads its build artifacts relative to process.cwd(). On Vercel the function's cwd is the
// lambda root (e.g. /var/task), not this directory, so point the cwd at the server directory (the
// parent of this api/ folder) before loading the app. The import is dynamic so it runs AFTER chdir —
// a static import is hoisted and would read files at the wrong cwd.
process.chdir(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

const { default: createApp } = await import('../src/app.js');
const app = createApp({ serveStaticAssets: false });

export const config = { runtime: 'nodejs' };

async function handleRequest(req, res) {
  const method = req.method || 'GET';

  // Buffer the body eagerly — see the note above.
  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const request = new Request(protocol + '://' + host + req.url, {
    method,
    headers: req.headers,
    body,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

// 256 KiB max frame, matching the Node server (src/index.js) and Vercel's documented default for
// WebSocket functions.
const wss = new WebSocketServer({ noServer: true, maxPayload: 256 * 1024 });

// createAdaptorServer attaches the WebSocket upgrade handling to the server it creates. The
// createServer option swaps its lazily-reading request listener for handleRequest, so only
// upgrades go through @hono/node-server.
const server = createAdaptorServer({
  fetch: app.fetch,
  websocket: { server: wss },
  createServer: (serverOptions) => http.createServer(serverOptions, handleRequest),
});

export default server;
`;

export default apiHandler;
