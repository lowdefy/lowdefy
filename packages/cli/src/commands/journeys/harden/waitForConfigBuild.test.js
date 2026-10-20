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

import http from 'http';

import waitForConfigBuild from './waitForConfigBuild.js';

// A dev server whose build-status answers come from `answers`, one per read,
// the last repeated.
let server;
let url;
let answers;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const answer = answers.length > 1 ? answers.shift() : answers[0];
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify(answer));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
});

test('waitForConfigBuild waits out a failed config build and returns the next build id', async () => {
  answers = [
    { buildId: 'build-1', build: { status: 'error', configStatus: 'error' } },
    { buildId: 'build-2', build: { status: 'ok', configStatus: 'ok' } },
  ];

  await expect(waitForConfigBuild({ url, pollIntervalMs: 10, timeoutMs: 5000 })).resolves.toBe(
    'build-2'
  );
});

test('waitForConfigBuild takes a config build with a failing page as built', async () => {
  answers = [
    {
      buildId: 'build-3',
      build: { status: 'pages_failed', configStatus: 'ok', failedPages: ['orders'] },
    },
  ];

  await expect(waitForConfigBuild({ url, pollIntervalMs: 10, timeoutMs: 5000 })).resolves.toBe(
    'build-3'
  );
});

test('waitForConfigBuild stops once the config build stays failed past the timeout', async () => {
  answers = [{ buildId: 'build-1', build: { status: 'error', configStatus: 'error' } }];

  await expect(waitForConfigBuild({ url, pollIntervalMs: 10, timeoutMs: 50 })).rejects.toThrow(
    'The config build did not succeed'
  );
});
