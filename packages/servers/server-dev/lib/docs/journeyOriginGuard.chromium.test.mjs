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
import os from 'node:os';

import { vi, afterAll, beforeAll, expect, test } from 'vitest';

import pageReadyScript from '../../test-utils/pageReadyScript.mjs';

// A real Chromium against a server listening on every interface, so localhost, 127.0.0.1, [::1]
// and the LAN address all reach it, as they reach a dev server. A data set journey's context on
// localhost must never reach it under the other hosts (each of those requests would carry no data
// cookie and read the real database), and must still keep its HTTP cache, so a second page load
// reuses the immutable chunk. Skipped when no Chromium can be launched.
vi.doMock('../build/config.js', () => ({ default: {} }));

const { getBrowser, openPage } = await import('./getBrowser.js');

const lanAddress = Object.values(os.networkInterfaces())
  .flat()
  .find((entry) => entry.family === 'IPv4' && !entry.internal)?.address;

let server;
let port;
let origin;
const received = [];

function otherHostUrls() {
  const urls = [
    `http://127.0.0.1:${port}/api/request/other`,
    `http://[::1]:${port}/api/request/other`,
  ];
  if (lanAddress !== undefined) {
    urls.push(`http://${lanAddress}:${port}/api/request/other`);
  }
  return urls;
}

// The page loads its chunk, then tries every other host of the server, then marks itself ready.
function pageHtml(pageId) {
  return `<!doctype html><html><head><script src="/chunk.js"></script></head><body><script>
    Promise.allSettled(${JSON.stringify(otherHostUrls())}.map((url) => fetch(url, { method: 'POST' })))
      .then(() => { ${pageReadyScript({ pageId })} });
  </script></body></html>`;
}

beforeAll(async () => {
  server = http.createServer((req, res) => {
    received.push({ host: req.headers.host, url: req.url });
    if (req.url === '/chunk.js') {
      res.writeHead(200, {
        'content-type': 'text/javascript',
        'cache-control': 'max-age=31536000,immutable',
      });
      res.end('window.chunkLoaded = true;');
      return;
    }
    if (req.url.startsWith('/api/')) {
      res.writeHead(200, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      });
      res.end('{}');
      return;
    }
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end(pageHtml(req.url.slice(1)));
  });
  await new Promise((resolve) => server.listen(0, '::', resolve));
  port = server.address().port;
  origin = `http://localhost:${port}`;
});

let browser = null;
beforeAll(async () => {
  try {
    browser = await getBrowser({ origin });
  } catch {
    browser = null;
  }
});

// Closing Chromium on Windows can take longer than the 10 s hook default.
afterAll(async () => {
  await browser?.close();
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}, 30000);

test('a data set journey never reaches the dev server under another host, and keeps its HTTP cache', async (context) => {
  if (browser === null) {
    context.skip();
  }
  received.length = 0;
  const opened = await openPage({ browser, origin, pageId: 'first', dataCookie: 'session1' });
  try {
    expect(opened.ready).toBe(true);
    await opened.page.goto(`${origin}/second`, { waitUntil: 'load' });
    await opened.page.waitForFunction(() => window.lowdefy?.pageId === 'second');

    // Every request the server saw came in under the journey's own host.
    expect(received.filter(({ host }) => host !== `localhost:${port}`)).toEqual([]);
    // The runner saw each attempt, on both page loads, so it fails the step that made it.
    expect(opened.leftOrigin).toEqual([...otherHostUrls(), ...otherHostUrls()]);
    // The second page load took the chunk from the cache.
    expect(received.map(({ url }) => url)).toEqual(['/first', '/chunk.js', '/second']);
  } finally {
    await opened.context.close();
  }
});
