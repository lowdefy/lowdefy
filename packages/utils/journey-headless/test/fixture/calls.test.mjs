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

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterAll, beforeAll, expect, test } from 'vitest';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// call, request, expect.status, expect.db and expect.calls payloads, headless, over a copy of the
// journey-fixture build in which log_activity (which writes) is gated to the auditor role, as
// @lowdefy/test-utils' session suites gate it. The fixture app has no gated endpoint that
// writes, and its journey suites count its endpoints, so the app is left as it is.

let directory;
let host;
let pageHost;

function copyBuildWithGatedWrite() {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-journey-headless-calls-'));
  const configDirectory = path.join(directory, 'config');
  const serverDirectory = path.join(directory, 'server');
  fs.cpSync(journeyFixture.configDirectory, configDirectory, {
    recursive: true,
    preserveTimestamps: true,
    filter: (source) =>
      !source.split(path.sep).some((part) => part === '.lowdefy' || part === 'node_modules'),
  });
  fs.mkdirSync(serverDirectory);
  fs.cpSync(
    path.join(journeyFixture.serverDirectory, 'build'),
    path.join(serverDirectory, 'build'),
    { recursive: true, preserveTimestamps: true }
  );
  fs.symlinkSync(
    path.join(journeyFixture.serverDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'dir'
  );
  const logActivityPath = path.join(serverDirectory, 'build', 'api', 'log_activity.json');
  const logActivity = JSON.parse(fs.readFileSync(logActivityPath, 'utf8'));
  logActivity.auth = { public: false, roles: ['auditor'] };
  fs.writeFileSync(logActivityPath, JSON.stringify(logActivity));
  // Written after the config, so the copied build is as fresh as the original.
  const later = new Date(Date.now() + 1000);
  fs.utimesSync(path.join(serverDirectory, 'build', 'refMap.json'), later, later);
  return { configDirectory, serverDirectory };
}

beforeAll(async () => {
  host = await createBuildHost({ ...copyBuildWithGatedWrite(), data: 'roles', user: 'member' });
  pageHost = await createBuildHost({ ...journeyFixture, data: 'harden', user: 'member' });
});

afterAll(async () => {
  await Promise.all([host?.close(), pageHost?.close()]);
  if (directory) fs.rmSync(directory, { recursive: true, force: true });
});

test('a page-less journey is refused a gated write, and the same call as an allowed user writes', async () => {
  const result = await runHeadlessJourney({
    host,
    journey: {
      steps: [
        { call: { endpoint: 'log_activity', payload: { source: 'member' } } },
        { expect: { status: 403 } },
        { expect: { error: 'API Endpoint "log_activity" does not exist.' } },
        { expect: { db: { collection: 'items', match: { kind: 'activity' }, count: 0 } } },
        { call: { endpoint: 'log_activity', payload: { source: 'auditor' }, as: 'auditor' } },
        { expect: { status: 200 } },
        {
          expect: {
            db: {
              collection: 'items',
              match: { kind: 'activity' },
              equals: [{ kind: 'activity', source: 'auditor' }],
            },
          },
        },
        { expect: { calls: { endpoint: 'log_activity', count: 1 } } },
      ],
    },
    stepTimeout: 2000,
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.calls.map(({ actor, status }) => ({ actor, status }))).toEqual([
    { actor: 'main', status: 403 },
    { actor: 'auditor', status: 200 },
  ]);
});

test('expect.status names the answer it read when it differs', async () => {
  const result = await runHeadlessJourney({
    host,
    journey: {
      steps: [
        { call: { endpoint: 'log_activity', payload: { source: 'member' } } },
        { expect: { status: 200 } },
      ],
    },
    stepTimeout: 2000,
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toMatchObject({
    index: 1,
    expected: 200,
    actual: 403,
    message:
      'Expected endpoint "log_activity" to answer 200 but it answered 403: API Endpoint "log_activity" does not exist..',
  });
});

test('a call as a user the data set does not have is refused before any call, naming its users', async () => {
  const result = await runHeadlessJourney({
    host,
    journey: {
      steps: [{ call: { endpoint: 'log_activity', payload: {}, as: 'admin' } }],
    },
  });
  expect(result).toEqual({
    error: 'User "admin" is not in data set "roles". Its users are "auditor", "member".',
    refused: true,
  });
  expect(
    await host.findDocuments({ collection: 'items', match: { kind: 'activity', source: 'admin' } })
  ).toEqual([]);
});

test('expect.calls checks the payload the page sent, and names the path that differs', async () => {
  const steps = [
    { fill: { blockId: 'name_input', value: 'Payload item' } },
    { click: 'save_button' },
    { wait: { request: 'save_item' } },
  ];
  const passes = await runHeadlessJourney({
    host: pageHost,
    journey: {
      pageId: 'home',
      steps: [
        ...steps,
        {
          expect: {
            calls: {
              request: 'save_item',
              count: 1,
              payload: { name: 'Payload item' },
              response: { acknowledged: true },
            },
          },
        },
      ],
    },
    stepTimeout: 2000,
  });
  expect(passes.failure).toBeUndefined();
  expect(passes.passed).toBe(true);

  const fails = await runHeadlessJourney({
    host: pageHost,
    journey: {
      pageId: 'home',
      steps: [
        ...steps,
        { expect: { calls: { request: 'save_item', payload: { name: 'Other' } } } },
      ],
    },
    stepTimeout: 2000,
  });
  expect(fails.passed).toBe(false);
  expect(fails.failure.index).toBe(3);
  expect(fails.failure.message).toContain(
    'Expected the last call to request "save_item" on page "home" (call 1 of 1) to hold the payload given:'
  );
  expect(fails.failure.message).toContain('name');
  expect(fails.failure.actual).toEqual({ name: 'Payload item' });
});

test('a request step calls a page request directly with the payload given', async () => {
  const result = await runHeadlessJourney({
    host: pageHost,
    journey: {
      steps: [
        { request: { pageId: 'home', requestId: 'save_item', payload: { name: 'Direct item' } } },
        { expect: { status: 200 } },
        { expect: { calls: { request: 'save_item', pageId: 'home', count: 1 } } },
        {
          expect: {
            db: { collection: 'items', match: { name: 'Direct item' }, equals: [{ page: 'home' }] },
          },
        },
      ],
    },
    stepTimeout: 2000,
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});
