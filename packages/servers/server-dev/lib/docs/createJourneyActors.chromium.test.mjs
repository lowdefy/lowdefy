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

// A real Chromium against a small server that answers the dev server's own
// routes, so the context-level request listener is exercised as a journey
// runs it: installed before the first navigation, and still counting after a
// full page load. Skipped when no Chromium can be launched.
jest.unstable_mockModule('../build/config.js', () => ({ default: {} }));

const { getBrowser } = await import('./getBrowser.js');
const { default: createJourneyActors } = await import('./createJourneyActors.js');

function pageHtml(script) {
  return `<!doctype html><html><head><title>loading</title></head><body><script>${script}</script></body></html>`;
}

const recorderPosts = [];

const pages = {
  '/recorded': pageHtml(`
    window.__lowdefyRecorder = {
      flush: () => fetch('/api/dev-recording', { method: 'POST', body: JSON.stringify({ actor: document.cookie }) }),
    };
    document.title = 'recorded-ready';
  `),
  '/first': pageHtml(`
    fetch('/api/root')
      .then(() => fetch('/api/page/first'))
      .then(() => fetch('/api/request/first/save', { method: 'POST' }))
      .then(() => fetch('/api/endpoints/notify', { method: 'POST' }))
      .then(() => { document.title = 'first-done'; });
  `),
  '/second': pageHtml(`
    fetch('/api/page/second')
      .then(() => fetch('/api/request/first/save', { method: 'POST' }))
      .then(() => { document.title = 'second-done'; });
  `),
};

let server;
let origin;
let browser = null;
try {
  browser = await getBrowser();
} catch {
  browser = null;
}
const chromiumTest = browser === null ? test.skip : test;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    if (req.url === '/api/dev-recording') {
      recorderPosts.push({ cookie: req.headers.cookie ?? '' });
    }
    const html = pages[req.url];
    if (html !== undefined) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(html);
      return;
    }
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end('{}');
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
});

chromiumTest(
  'journey actors count pages, request calls, endpoints and app events across a full page load',
  async () => {
    const actors = createJourneyActors({
      browser,
      origin,
      basePath: '',
      pageId: 'first',
      user: 'none',
      timeout: 500,
    });
    try {
      const { page } = await actors.switchTo('main');
      await page.waitForFunction(() => document.title === 'first-done');
      await page.goto(`${origin}/second`);
      await page.waitForFunction(() => document.title === 'second-done');

      expect(actors.countCalls({ request: 'save', pageId: 'first' })).toEqual(2);
      expect(actors.countCalls({ endpoint: 'notify' })).toEqual(1);
      expect(actors.networkSnapshots()).toEqual([
        {
          pages: ['first', 'second'],
          appEvents: true,
          requests: [{ pageId: 'first', requestId: 'save', calls: 2 }],
          endpoints: [{ endpointId: 'notify', calls: 1 }],
        },
      ]);
    } finally {
      await actors.closeAll();
    }
  },
  30000
);

chromiumTest(
  'a second journey actor counts its own requests apart from the first',
  async () => {
    const actors = createJourneyActors({
      browser,
      origin,
      basePath: '',
      pageId: 'second',
      user: 'none',
      timeout: 500,
    });
    try {
      const main = await actors.switchTo('main');
      await main.page.waitForFunction(() => document.title === 'second-done');
      const other = await actors.switchTo('other');
      await other.page.waitForFunction(() => document.title === 'second-done');
      await other.page.reload();
      await other.page.waitForFunction(() => document.title === 'second-done');
      expect(actors.countCalls({ request: 'save', pageId: 'first' })).toEqual(2);
      await actors.switchTo('main');
      expect(actors.countCalls({ request: 'save', pageId: 'first' })).toEqual(1);
    } finally {
      await actors.closeAll();
    }
  },
  30000
);

chromiumTest(
  'recording actors carry a recording cookie with their actor name and flush before closing',
  async () => {
    const { default: readRecordingCookie } = await import(
      '../server/recording/readRecordingCookie.js'
    );
    const actors = createJourneyActors({
      browser,
      origin,
      basePath: '',
      pageId: 'recorded',
      user: 'none',
      timeout: 500,
      recording: {
        source: 'journey',
        run: { id: '20261003T151200Z-p0d4rm', by: 'test', journey: 'tests/journeys/a.yaml' },
      },
    });
    try {
      const { page } = await actors.switchTo('main');
      await page.waitForFunction(() => document.title === 'recorded-ready');
      await actors.switchTo('invitee');
      await actors.flushRecordings();
    } finally {
      await actors.closeAll();
    }
    expect(recorderPosts).toHaveLength(2);
    const runs = recorderPosts
      .map(({ cookie }) => readRecordingCookie(cookie))
      .map((recording) => recording.run.actor)
      .sort();
    expect(runs).toEqual(['invitee', 'main']);
  },
  30000
);

chromiumTest(
  'a non-recording actor is marked off and a page with no recorder flushes without error',
  async () => {
    const actors = createJourneyActors({
      browser,
      origin,
      basePath: '',
      pageId: 'second',
      user: 'none',
      timeout: 500,
    });
    try {
      const { context } = await actors.switchTo('main');
      const cookies = await context.cookies();
      const recording = cookies.find((cookie) => cookie.name === 'lowdefy_recording');
      expect(recording.value.endsWith('.off')).toBe(true);
      await expect(actors.flushRecordings()).resolves.toBeUndefined();
    } finally {
      await actors.closeAll();
    }
  },
  30000
);
