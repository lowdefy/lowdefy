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

// A real Chromium against a small server that resolves every request's
// cookie header the way createLowdefyContext does, so the browser leg of a
// mutant run is pinned: the cookie openPage writes is the one the dev server
// verifies, it rides every request of every actor of the journey and nothing
// from any other context, page JavaScript cannot read it, and a detached hop
// forwards it alone. Skipped when no Chromium can be launched.
jest.unstable_mockModule('../build/config.js', () => ({ default: {} }));

const { getBrowser, openPage } = await import('./getBrowser.js');
const { default: createJourneyActors } = await import('./createJourneyActors.js');
const { openMutantRun, readMutantRun } = await import('../server/mutants/mutantRuns.js');
const { forwardJourneyCookies } = await import('../server/journeyCookies.js');
const { journeyActorToken } = await import('../server/auth/journeyActor.js');

function pageHtml(pageId) {
  return `<!doctype html><html><head><title>loading</title></head><body><script>
    fetch('/api/page/${pageId}', { credentials: 'same-origin' })
      .then(() => fetch('/api/request/${pageId}/save', { method: 'POST' }))
      .then(() => { document.title = 'done'; });
  </script></body></html>`;
}

let server;
let origin;
const received = [];
let browser = null;
try {
  browser = await getBrowser();
} catch {
  browser = null;
}
const chromiumTest = browser === null ? test.skip : test;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const [, pageId] = req.url.match(/^\/(?:api\/(?:page|request)\/)?([a-z]+)/) ?? [];
    received.push({ url: req.url, pageId, cookie: req.headers.cookie });
    if (!req.url.startsWith('/api/')) {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end(pageHtml(pageId));
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
  'a mutant cookie reaches only the journey actors, unreadable by the page, and alone on the loopback hop',
  async () => {
    const opened = openMutantRun({
      mutant: {
        buildId: 'b',
        artifact: 'pages/journey.json',
        key: 'k',
        arg: null,
        operator: 'drop-block',
      },
    });
    const actors = createJourneyActors({
      browser,
      origin,
      basePath: '',
      pageId: 'journey',
      user: 'none',
      timeout: 2000,
      mutantCookie: opened.cookiePayload,
    });
    let bystander;
    try {
      const main = await actors.switchTo('main');
      await main.page.waitForFunction(() => document.title === 'done');
      const other = await actors.switchTo('other');
      await other.page.waitForFunction(() => document.title === 'done');
      // A developer's tab, open beside the run.
      bystander = await openPage({
        browser,
        origin,
        pageId: 'bystander',
        user: 'none',
        timeout: 2000,
      });
      await bystander.page.waitForFunction(() => document.title === 'done');

      expect(await main.page.evaluate(() => document.cookie)).not.toContain('lowdefy_journey');

      const journeyRequests = received.filter((request) => request.pageId === 'journey');
      const bystanderRequests = received.filter((request) => request.pageId === 'bystander');
      // Each actor loads the page, then its page config and request: six in all.
      expect(journeyRequests).toHaveLength(6);
      expect(bystanderRequests).toHaveLength(3);
      journeyRequests.forEach((request) => {
        expect(readMutantRun(request.cookie)).toBe(opened.run);
        expect(forwardJourneyCookies({ cookieHeader: request.cookie })).toEqual(
          `lowdefy_journey_mutant=${journeyActorToken}.${opened.cookiePayload}`
        );
      });
      bystanderRequests.forEach((request) => {
        expect(readMutantRun(request.cookie)).toBeNull();
        expect(forwardJourneyCookies({ cookieHeader: request.cookie })).toEqual('');
      });
    } finally {
      await bystander?.context.close();
      await actors.closeAll();
      opened.close();
    }
  },
  30000
);
