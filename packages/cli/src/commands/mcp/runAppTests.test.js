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
  writeJourney('orders.yaml', { name: 'orders list', pageId: 'orders', steps: [{ wait: 1 }] });
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
  writeJourney('orders.yaml', { name: 'orders list', pageId: 'orders', steps: [{ wait: 1 }] });
  writeJourney('refunds.yaml', { name: 'refund button', pageId: 'refunds', steps: [{ wait: 1 }] });

  const { summary } = await runAppTests({ configDirectory, url, filter: 'ORDERS' });

  expect(summary).toEqual('1 passed, 0 failed of 1 journeys');
});

test('runAppTests says when no journey matches the filter', async () => {
  writeJourney('orders.yaml', { name: 'orders list', pageId: 'orders', steps: [{ wait: 1 }] });
  expect((await runAppTests({ configDirectory, url, filter: 'nope' })).summary).toEqual(
    'No tests matched filter "nope".'
  );
});
