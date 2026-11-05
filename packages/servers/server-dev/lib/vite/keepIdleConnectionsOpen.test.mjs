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

import { spawn } from 'node:child_process';
import net from 'node:net';

import { afterEach, expect, test } from 'vitest';

const pluginUrl = new URL('./keepIdleConnectionsOpen.js', import.meta.url).href;

const BLOCK_MS = 1000;

// Runs in its own process, so its blocked event loop does not block the test's
// client. A timer far shorter than Node's default keeps the test quick; it
// expires during the block just as the default does in a long page build.
function serverScript({ applyPlugin }) {
  return `
    import http from 'node:http';
    import keepIdleConnectionsOpen from ${JSON.stringify(pluginUrl)};
    const server = http.createServer((req, res) => {
      req.resume();
      req.on('end', () => {
        if (req.url === '/block') {
          res.on('finish', () => setImmediate(() => {
            const until = Date.now() + ${BLOCK_MS};
            while (Date.now() < until);
          }));
        }
        res.end('answered ' + req.url);
      });
    });
    server.keepAliveTimeout = 100;
    server.keepAliveTimeoutBuffer = 0;
    ${applyPlugin ? 'keepIdleConnectionsOpen().configureServer({ httpServer: server });' : ''}
    server.listen(0, '127.0.0.1', () => console.log(server.address().port));
  `;
}

let serverProcess;

afterEach(() => {
  serverProcess?.kill();
});

function startServer({ applyPlugin }) {
  serverProcess = spawn(process.execPath, [
    '--input-type=module',
    '-e',
    serverScript({ applyPlugin }),
  ]);
  return new Promise((resolve, reject) => {
    serverProcess.once('error', reject);
    serverProcess.stdout.once('data', (data) => resolve(Number(String(data))));
  });
}

// Writes the second request on the first's connection while the server is
// blocked, as the proxy's agent does when it reuses an idle socket.
function postDuringBlock({ port }) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port });
    let responses = '';
    let posted = false;
    socket.on('error', (error) => resolve({ error: error.code }));
    socket.on('close', () => resolve({ responses }));
    socket.on('data', (data) => {
      responses += String(data);
      if (!posted && responses.includes('answered /block')) {
        posted = true;
        setTimeout(() => {
          socket.write('POST /save HTTP/1.1\r\nHost: x\r\nContent-Length: 0\r\n\r\n');
        }, 50);
      }
      if (responses.includes('answered /save')) {
        socket.destroy();
      }
    });
    socket.write('GET /block HTTP/1.1\r\nHost: x\r\n\r\n');
  });
}

test('a keep-alive timer that expires while the event loop is blocked resets a request already sent', async () => {
  const port = await startServer({ applyPlugin: false });
  expect(await postDuringBlock({ port })).toEqual({ error: 'ECONNRESET' });
});

test('keepIdleConnectionsOpen answers a request sent while the event loop is blocked', async () => {
  const port = await startServer({ applyPlugin: true });
  const { responses } = await postDuringBlock({ port });
  expect(responses).toContain('answered /save');
});
