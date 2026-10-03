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

import { jest } from '@jest/globals';

// A real Chromium against a server listening on every loopback address, so the same port answers
// on 127.0.0.1 and on localhost. A data set journey's page that reaches the server on the other
// host must be stopped in the browser: the server never sees that request. Without a data cookie
// the same page does reach it, which proves the other host is reachable at all. Skipped when no
// Chromium can be launched.
jest.unstable_mockModule('../build/config.js', () => ({ default: {} }));

const { getBrowser, openPage } = await import('./getBrowser.js');

let server;
let port;
let seen = [];
let browser = null;
try {
  browser = await getBrowser();
} catch {
  browser = null;
}
const chromiumTest = browser === null ? test.skip : test;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    seen.push(`${req.headers.host}${req.url}`);
    if (req.url === '/start') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(
        `<!doctype html><html><head><title>loading</title></head><body><script>
          fetch('http://localhost:${port}/api/root', { mode: 'no-cors' })
            .catch(() => {})
            .then(() => { document.title = 'done'; });
        </script></body></html>`
      );
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise((resolve) => server.listen(0, resolve));
  port = server.address().port;
});

beforeEach(() => {
  seen = [];
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

async function openStart({ dataCookie }) {
  const opened = await openPage({
    browser,
    origin: `http://127.0.0.1:${port}`,
    pageId: 'start',
    user: 'none',
    dataCookie,
    timeout: 500,
  });
  await opened.page.waitForFunction(() => document.title === 'done', null, { timeout: 2000 });
  return opened;
}

chromiumTest('without a data cookie the page reaches the server on its other host', async () => {
  const opened = await openStart({ dataCookie: undefined });
  try {
    expect(seen).toContain(`localhost:${port}/api/root`);
    expect(opened.leftOrigin).toEqual([]);
  } finally {
    await opened.context.close();
  }
});

chromiumTest(
  'a data set journey page is stopped before it reaches the server on another host',
  async () => {
    const opened = await openStart({ dataCookie: 'session1' });
    try {
      expect(seen).toEqual([`127.0.0.1:${port}/start`]);
      expect(opened.leftOrigin).toEqual([`http://localhost:${port}/api/root`]);
    } finally {
      await opened.context.close();
    }
  }
);
