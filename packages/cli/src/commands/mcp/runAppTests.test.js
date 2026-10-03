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

import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

import runAppTests from './runAppTests.js';

let configDirectory;
let server;
let url;

beforeEach(async () => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-run-tests-'));
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys'), { recursive: true });
  // Stands in for the dev server's POST /lowdefy-docs/journey.
  server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      if (req.url === '/lowdefy-docs/build-status') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ buildId: 'build-1' }));
        return;
      }
      const { pageId } = JSON.parse(body);
      res.setHeader('Content-Type', 'application/json');
      if (pageId === 'orders') {
        res.end(JSON.stringify({ passed: true }));
        return;
      }
      res.end(
        JSON.stringify({
          passed: false,
          failure: {
            index: 0,
            step: { expect: { visible: 'refund' } },
            expected: true,
            actual: false,
            message: 'refund is hidden',
          },
        })
      );
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterEach(() => {
  server.close();
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function writeJourney(fileName, journey) {
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'journeys', fileName),
    JSON.stringify(journey)
  );
}

test('runAppTests runs every journey against the dev server and reports each as data', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    steps: [{ wait: { ms: 1 } }],
  });
  writeJourney('refunds.yaml', {
    name: 'refund button',
    pageId: 'refunds',
    steps: [{ expect: { visible: 'refund' } }],
  });

  const { summary, results } = await runAppTests({ configDirectory, url });

  expect(summary).toEqual('1 passed, 1 failed of 2 journeys');
  expect(results[0]).toMatchObject({
    name: 'orders list',
    passed: true,
    filePath: 'tests/journeys/orders.yaml',
  });
  expect(results[1]).toMatchObject({ name: 'refund button', passed: false });
  expect(results[1].report).toContain('refund is hidden');
});

test('runAppTests runs only the journeys matching the filter', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    steps: [{ wait: { ms: 1 } }],
  });
  writeJourney('refunds.yaml', {
    name: 'refund button',
    pageId: 'refunds',
    steps: [{ wait: { ms: 1 } }],
  });

  const { summary } = await runAppTests({ configDirectory, url, filter: 'ORDERS' });

  expect(summary).toEqual('1 passed, 0 failed of 1 journeys');
});

test('runAppTests says when no journey matches the filter', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    steps: [{ wait: { ms: 1 } }],
  });
  expect((await runAppTests({ configDirectory, url, filter: 'nope' })).summary).toEqual(
    'No tests matched filter "nope".'
  );
});

test('runAppTests honours paths and repeat and returns the class of each journey', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    steps: [{ wait: { ms: 1 } }],
  });
  fs.mkdirSync(path.join(configDirectory, 'tests', 'journeys', '_candidates'));
  fs.writeFileSync(
    path.join(configDirectory, 'tests', 'journeys', '_candidates', 'refunds.yaml'),
    JSON.stringify({ name: 'refund button', pageId: 'refunds', steps: [{ wait: { ms: 1 } }] })
  );
  const { summary, results } = await runAppTests({
    configDirectory,
    url,
    paths: ['tests/journeys/_candidates'],
    repeat: 2,
  });
  expect(summary).toEqual('0 passed, 1 failed of 1 journeys');
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({
    name: 'refund button',
    class: 'FAIL',
    runs: 2,
    passedRuns: 0,
    filePath: path.join('tests', 'journeys', '_candidates', 'refunds.yaml'),
  });
});

test('runAppTests refuses a path outside the app directory and a repeat out of range', async () => {
  expect(await runAppTests({ configDirectory, url, paths: ['../x.yaml'] })).toEqual({
    summary: `Journey path "../x.yaml" is outside the config directory ${configDirectory}.`,
    results: [],
  });
  expect(await runAppTests({ configDirectory, url, repeat: 20 })).toEqual({
    summary: '--repeat must be an integer from 1 to 10. Received 20.',
    results: [],
  });
});

test('runAppTests records a full-suite run and leaves a paths or filter run unrecorded', async () => {
  const bodies = [];
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      if (req.url === '/lowdefy-docs/build-status') {
        res.end(JSON.stringify({ buildId: 'build-1' }));
        return;
      }
      bodies.push(JSON.parse(body));
      res.end(JSON.stringify({ passed: true }));
    });
  });
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    steps: [{ wait: { ms: 1 } }],
  });
  await runAppTests({ configDirectory, url, repeat: 2 });
  await runAppTests({ configDirectory, url, filter: 'orders' });
  await runAppTests({ configDirectory, url, paths: ['tests/journeys/orders.yaml'] });
  expect(bodies.map((body) => body.recording?.journey ?? null)).toEqual([
    'tests/journeys/orders.yaml#orders list',
    null,
    null,
    null,
  ]);
});

test('runAppTests returns journey evidence and the PASS line that shows it', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    evidence: {
      production: {
        sessions: 412,
        persons: 37,
        orgs: 9,
        share: 0.31,
        failures: 14,
        window: '2026-09-03/2026-10-02',
      },
      refreshed: '2026-10-03',
    },
    steps: [{ wait: { ms: 1 } }],
  });

  const { results } = await runAppTests({ configDirectory, url });

  expect(results[0].evidence.production.sessions).toBe(412);
  expect(results[0].report).toContain('412 sessions · 9 orgs');
});
