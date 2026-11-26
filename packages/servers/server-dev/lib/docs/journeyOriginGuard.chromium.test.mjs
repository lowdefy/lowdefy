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

// A real Chromium against a "dev server" listening on every interface, so localhost, 127.0.0.1,
// [::1] and the LAN address all reach it, as they reach a dev server under --lan. The environment
// names a forward proxy the test runs, which resolves an /etc/hosts-style alias (devalias.test) to
// this machine, as a local debugging proxy would. A data set journey's context must reach the dev
// server under its own host only: under any other host, direct or through the proxy, a request
// would carry no data cookie and read the real database. It must still keep its HTTP cache, and
// the proxy must still carry requests to other ports.
vi.doMock('../build/config.js', () => ({ default: {} }));

const { getBrowser, openPage } = await import('./getBrowser.js');

const PROXY_VARIABLES = [
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'ALL_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'all_proxy',
  'no_proxy',
];
const savedProxyEnv = Object.fromEntries(PROXY_VARIABLES.map((name) => [name, process.env[name]]));

const lanAddress = Object.values(os.networkInterfaces())
  .flat()
  .find((entry) => entry.family === 'IPv4' && !entry.internal)?.address;

let devServer;
let proxyServer;
let externalServer;
let port;
let externalPort;
// Whether the dev server listens on IPv6 too: a host without IPv6 (some CI containers) cannot.
let ipv6 = true;
const received = [];
const proxied = [];
// Each page's script: the URLs it tries on the dev server's port under other hosts.
const pageTargets = {};

function devServerHandler(req, res) {
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
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
    res.end('{}');
    return;
  }
  const pageId = req.url.slice(1);
  // The page loads its chunk, tries every other host of the dev server and a site on another
  // port through the proxy, then marks itself ready.
  // The empty icon keeps Chromium from asking for /favicon.ico, which on Linux it does on every
  // load, so the requests below are the page's own.
  res.writeHead(200, { 'content-type': 'text/html' });
  res.end(`<!doctype html><html><head><link rel="icon" href="data:,"><script src="/chunk.js"></script></head><body><script>
    const others = ${JSON.stringify(pageTargets[pageId] ?? [])};
    Promise.allSettled(others.map((url) => fetch(url, { method: 'POST' })))
      .then(() => fetch('http://external.test:${externalPort}/', { method: 'POST' }))
      .then((response) => response.text())
      .then((text) => { window.external = text; }, () => { window.external = 'failed'; })
      .then(() => { ${pageReadyScript({ pageId })} });
  </script></body></html>`);
}

// A forward proxy that resolves names itself: devalias.test and external.test are this machine.
function proxyHandler(req, res) {
  proxied.push(req.url);
  const url = new URL(req.url);
  const host = ['devalias.test', 'external.test'].includes(url.hostname)
    ? '127.0.0.1'
    : url.hostname.replace(/^\[(.*)\]$/, '$1');
  const forward = http.request(
    { host, port: url.port, path: url.pathname, method: req.method, headers: req.headers },
    (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    }
  );
  forward.on('error', () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(forward);
}

function listen(server, host) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, host, resolve);
  });
}

function otherHostUrls() {
  const urls = [
    `http://127.0.0.1:${port}/api/request/other`,
    `http://devalias.test:${port}/api/request/other`,
  ];
  if (ipv6) {
    urls.push(`http://[::1]:${port}/api/request/other`);
  }
  if (lanAddress !== undefined) {
    urls.push(`http://${lanAddress}:${port}/api/request/other`);
  }
  return urls;
}

let localhostBrowser = null;
let loopbackBrowser = null;

beforeAll(async () => {
  devServer = http.createServer(devServerHandler);
  try {
    await listen(devServer, '::');
  } catch {
    ipv6 = false;
    console.warn('journeyOriginGuard: no IPv6 on this host, so the [::1] case is skipped.');
    await listen(devServer, '0.0.0.0');
  }
  if (lanAddress === undefined) {
    console.warn('journeyOriginGuard: no LAN address on this host, so the LAN case is skipped.');
  }
  port = devServer.address().port;
  externalServer = http.createServer((req, res) => {
    res.writeHead(200, { 'access-control-allow-origin': '*' });
    res.end('external');
  });
  await listen(externalServer, '127.0.0.1');
  externalPort = externalServer.address().port;
  proxyServer = http.createServer(proxyHandler);
  await listen(proxyServer, '127.0.0.1');

  PROXY_VARIABLES.forEach((name) => delete process.env[name]);
  process.env.HTTP_PROXY = `http://127.0.0.1:${proxyServer.address().port}`;
  try {
    localhostBrowser = await getBrowser({ origin: `http://localhost:${port}` });
    loopbackBrowser = await getBrowser({ origin: `http://127.0.0.1:${port}` });
  } catch (error) {
    console.warn(`journeyOriginGuard: Chromium did not launch, so every case is skipped. ${error}`);
    localhostBrowser = null;
    loopbackBrowser = null;
  } finally {
    PROXY_VARIABLES.forEach((name) => {
      if (savedProxyEnv[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = savedProxyEnv[name];
      }
    });
  }
}, 60000);

// Closing Chromium on Windows can take longer than the 10 s hook default.
afterAll(async () => {
  await localhostBrowser?.close();
  await loopbackBrowser?.close();
  for (const server of [devServer, proxyServer, externalServer]) {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}, 30000);

test('a data set journey on localhost never reaches the dev server under another host, direct or through a proxy, and keeps its HTTP cache', async (context) => {
  if (localhostBrowser === null) {
    context.skip();
  }
  const origin = `http://localhost:${port}`;
  pageTargets.first = otherHostUrls();
  pageTargets.second = otherHostUrls();
  received.length = 0;
  proxied.length = 0;
  const opened = await openPage({
    browser: localhostBrowser,
    origin,
    pageId: 'first',
    dataCookie: 'session1',
  });
  try {
    expect(opened.ready).toBe(true);
    await opened.page.goto(`${origin}/second`, { waitUntil: 'load' });
    await opened.page.waitForFunction(() => window.lowdefy?.pageId === 'second');

    // The proxy is in use for other ports: the external site answered through it.
    expect(await opened.page.evaluate(() => window.external)).toEqual('external');
    expect(proxied).toEqual([
      `http://external.test:${externalPort}/`,
      `http://external.test:${externalPort}/`,
    ]);
    // Every request the dev server saw came in under the journey's own host.
    expect(received.filter(({ host }) => host !== `localhost:${port}`)).toEqual([]);
    // The runner saw each attempt, on both page loads, so it fails the step that made it.
    expect(opened.leftOrigin).toEqual([...otherHostUrls(), ...otherHostUrls()]);
    // The second page load took the chunk from the cache.
    expect(received.map(({ url }) => url)).toEqual(['/first', '/chunk.js', '/second']);
  } finally {
    await opened.context.close();
  }
});

test('a data set journey on 127.0.0.1 never reaches the dev server under localhost', async (context) => {
  if (loopbackBrowser === null) {
    context.skip();
  }
  const origin = `http://127.0.0.1:${port}`;
  pageTargets.loopback = [`http://localhost:${port}/api/request/other`];
  received.length = 0;
  proxied.length = 0;
  const opened = await openPage({
    browser: loopbackBrowser,
    origin,
    pageId: 'loopback',
    dataCookie: 'session1',
  });
  try {
    expect(opened.ready).toBe(true);
    expect(received.filter(({ host }) => host !== `127.0.0.1:${port}`)).toEqual([]);
    expect(proxied.filter((url) => url.includes(`:${port}/`))).toEqual([]);
    expect(opened.leftOrigin).toEqual([`http://localhost:${port}/api/request/other`]);
  } finally {
    await opened.context.close();
  }
});
