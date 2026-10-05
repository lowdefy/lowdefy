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

import flowLines from '../journeys/evidence/flowLines.js';
import runAppTests from './runAppTests.js';
import sequenceId from '../journeys/evidence/sequenceId.js';

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
    filePath: path.join('tests', 'journeys', 'orders.yaml'),
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
  // Only the recorded run writes run.json; the partial runs after it leave it.
  const testRun = JSON.parse(
    fs.readFileSync(path.join(configDirectory, '.lowdefy', 'test', 'run.json'), 'utf8')
  );
  expect(testRun).toEqual({
    version: 1,
    run: bodies[0].recording.run,
    journeys: { 'tests/journeys/orders.yaml#orders list': { passed: true } },
  });
});

// A journey on the orders page, which the stand-in server passes, refreshed
// with `sessions` over the 30 days of September. No evidence without them.
function rankedJourney({ name, sessions, failures = 0, ...rest }) {
  const steps = [{ click: name.replace(/\W/g, '_') }];
  const journey = { name, pageId: 'orders', ...rest, steps };
  if (sessions !== undefined) {
    journey.evidence = {
      production: {
        sequence: sequenceId({ pageId: 'orders', steps }),
        pageId: 'orders',
        flow: flowLines({ pageId: 'orders', steps }),
        months: [{ month: '2026-09', days: 30, sessions, persons: 37, orgs: 9, failures }],
      },
      refreshed: '2026-10-03',
    };
  }
  return journey;
}

test('runAppTests returns journey evidence and the PASS line that shows its tier', async () => {
  writeJourney('orders.yaml', rankedJourney({ name: 'orders list', sessions: 411, failures: 14 }));

  const { results } = await runAppTests({ configDirectory, url });

  expect(results[0].evidence.production.months[0].sessions).toBe(411);
  expect(results[0].usage).toEqual({
    tier: 'common',
    rank: 1,
    rate: 13.7,
    failures: 14,
    unranked: false,
    usageWindow: '3m',
  });
  expect(results[0].report).toContain('common #1 · 13.7/day · 14 failed (3m)');
});

test('runAppTests tier common runs the common and unranked journeys and skips deprecated ones', async () => {
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
  writeJourney('a.yaml', rankedJourney({ name: 'top', sessions: 300 }));
  writeJourney('b.yaml', rankedJourney({ name: 'middle', sessions: 60 }));
  writeJourney('c.yaml', rankedJourney({ name: 'new' }));
  writeJourney('d.yaml', rankedJourney({ name: 'retired', sessions: 30, deprecated: true }));

  const { summary, results } = await runAppTests({ configDirectory, url, tier: 'common' });

  expect(results.map((result) => result.name)).toEqual(['top', 'new', 'retired']);
  expect(results[2]).toEqual({
    name: 'retired',
    filePath: path.join('tests', 'journeys', 'd.yaml'),
    skipped: 'deprecated',
    report: 'SKIP deprecated  retired  1.0/day (3m)',
  });
  expect(summary).toBe('2 passed, 0 failed of 2 journeys, 1 deprecated skipped');
  bodies.forEach((body) => expect(body).not.toHaveProperty('recording'));
});

test('runAppTests refuses a tier below 100 matches without running anything', async () => {
  writeJourney('a.yaml', rankedJourney({ name: 'top', sessions: 30 }));

  const result = await runAppTests({ configDirectory, url, tier: 'wide', usageWindow: '6m' });

  expect(result).toEqual({
    summary:
      'The selection has 30 journey matches in 2026-04 to 2026-09, fewer than the 100 tiers need. Use --tier full, or pull more production use.',
    results: [],
  });
});

function writeNestedJourney(relativePath, journey) {
  const filePath = path.join(configDirectory, 'tests', 'journeys', relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(journey));
}

test('runAppTests runs sub-folders in a full run, and a folder and its globs alike', async () => {
  writeJourney('orders.yaml', { name: 'orders list', pageId: 'orders', steps: [{ click: 'a' }] });
  writeNestedJourney('review/approve.yaml', {
    name: 'approves an order',
    pageId: 'orders',
    steps: [{ click: 'a' }],
  });
  writeNestedJourney('_candidates/refunds.yaml', {
    name: 'refund button',
    pageId: 'refunds',
    steps: [{ click: 'a' }],
  });
  const all = await runAppTests({ configDirectory, url });
  expect(all.results.map((result) => result.name)).toEqual(['orders list', 'approves an order']);
  const names = async (paths) =>
    (await runAppTests({ configDirectory, url, paths })).results.map((result) => result.name);
  expect(await names(['tests/journeys/review'])).toEqual(['approves an order']);
  expect(await names(['tests/journeys/review/**'])).toEqual(['approves an order']);
  expect(await names(['tests/journeys/review/*.yaml'])).toEqual(['approves an order']);
  expect(await runAppTests({ configDirectory, url, paths: ['tests/journeys/x/*.yaml'] })).toEqual({
    summary: 'Journey path "tests/journeys/x/*.yaml" matches no files.',
    results: [],
  });
});

test('runAppTests selects by tags and by a list of filters, and names them when nothing matched', async () => {
  writeJourney('orders.yaml', {
    name: 'orders list',
    pageId: 'orders',
    tags: ['smoke'],
    steps: [{ click: 'a' }],
  });
  writeJourney('totals.yaml', {
    name: 'order totals',
    pageId: 'orders',
    tags: ['nightly'],
    steps: [{ click: 'a' }],
  });
  writeJourney('refunds.yaml', {
    name: 'refund button',
    pageId: 'refunds',
    steps: [{ click: 'a' }],
  });
  const names = async (args) =>
    (await runAppTests({ configDirectory, url, ...args })).results.map((result) => result.name);
  expect(await names({ tags: ['smoke', 'nightly'] })).toEqual(['orders list', 'order totals']);
  expect(await names({ filter: ['totals', 'REFUND'] })).toEqual(['refund button', 'order totals']);
  expect(await names({ tags: ['nightly'], filter: 'orders' })).toEqual([]);
  expect(
    (await runAppTests({ configDirectory, url, tags: ['nightly'], filter: 'list' })).summary
  ).toEqual('No tests matched tag "nightly" and filter "list".');
  expect(await runAppTests({ configDirectory, url, tags: ['Smoke'] })).toEqual({
    summary:
      'Tag "Smoke" should be lowercase letters, digits, "-" and "_", start with a letter or digit, and be at most 64 characters.',
    results: [],
  });
});

test('runAppTests leaves a tagged run unrecorded', async () => {
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
    tags: ['smoke'],
    steps: [{ click: 'a' }],
  });
  await runAppTests({ configDirectory, url, tags: ['smoke'] });
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).not.toHaveProperty('recording');
});
