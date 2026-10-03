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

import { jest } from '@jest/globals';
import { Hono } from 'hono';
import { serializer } from '@lowdefy/helpers';

import { endpointFixture, pageFixture } from '../../../lib/server/mutants/test/fixtures.mjs';

const mockBuildPageIfNeeded = jest.fn();
jest.unstable_mockModule('../../../lib/server/jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
}));

const { default: docsMutantsHandler } = await import('./mutants.js');

const originalCwd = process.cwd();
let serverDirectory;

function write(name, content) {
  const filePath = path.join(serverDirectory, 'build', name);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content));
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBuildPageIfNeeded.mockResolvedValue(true);
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-mutants-route-'));
  const page = pageFixture();
  const endpoint = endpointFixture();
  write('pages/tickets.json', serializer.serializeToString(page.root));
  write('api/notify.json', serializer.serializeToString(endpoint.root));
  write('keyMap.json', { ...page.keyMap });
  write('refMap.json', {});
  write('buildStatus.json', { status: 'ok', timestamp: '2026-10-03T08:00:00.000Z' });
  process.chdir(serverDirectory);
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

async function post(body) {
  const app = new Hono();
  app.post('/lowdefy-docs/mutants', docsMutantsHandler);
  const response = await app.request('/lowdefy-docs/mutants', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}

test('POST /lowdefy-docs/mutants lists the mutants of the posted pages and endpoints with the build id and artifact hashes', async () => {
  const { status, data } = await post({ pages: ['tickets'], endpoints: ['notify'] });
  expect(status).toBe(200);
  expect(mockBuildPageIfNeeded).toHaveBeenCalledWith(
    expect.objectContaining({ pageId: 'tickets' })
  );
  expect(data.buildId).toEqual(expect.any(String));
  expect(Object.keys(data.artifacts)).toEqual(['pages/tickets.json', 'api/notify.json']);
  expect(data.artifacts['pages/tickets.json']).toMatch(/^[0-9a-f]{40}$/);
  const operators = new Set(data.mutants.map((mutant) => mutant.operator));
  expect(operators).toEqual(
    new Set([
      'drop-action',
      'skip-validate',
      'flip-visible',
      'swap-if',
      'drop-payload',
      'retarget-link',
      'drop-block',
      'drop-step',
    ])
  );
  const dropStep = data.mutants.find((mutant) => mutant.operator === 'drop-step');
  expect(dropStep).toMatchObject({
    artifact: 'api/notify.json',
    anchor: { type: 'endpoint', endpointId: 'notify' },
    copies: [],
  });
});

test('POST /lowdefy-docs/mutants keeps only the operators asked for', async () => {
  const { data } = await post({ pages: ['tickets'], operators: ['drop-block'] });
  expect(new Set(data.mutants.map((mutant) => mutant.operator))).toEqual(new Set(['drop-block']));
});

test('POST /lowdefy-docs/mutants builds the page of every posted request', async () => {
  await post({ requests: [{ pageId: 'tickets', requestId: 'assign_ticket' }] });
  expect(mockBuildPageIfNeeded.mock.calls.map(([args]) => args.pageId)).toEqual(['tickets']);
});

test.each([
  [{ pages: 'tickets' }, '"pages" must be an array of page ids'],
  [{ requests: [{ pageId: 'tickets' }] }, '"requests" must be an array of { pageId, requestId }'],
  [{ endpoints: [1] }, '"endpoints" must be an array of endpoint ids'],
  [{ appEvents: 'yes' }, '"appEvents" must be a boolean'],
  [{ operators: ['drop-everything'] }, '"operators" must be an array of operator names'],
  [{ pages: ['../../secrets'] }, '"pages" must be an array of page ids'],
  [
    { requests: [{ pageId: 'tickets', requestId: '../x' }] },
    '"requests" must be an array of { pageId, requestId }',
  ],
  [{ endpoints: ['../notify'] }, '"endpoints" must be an array of endpoint ids'],
])(
  'POST /lowdefy-docs/mutants answers a bad body %j with a 400 naming the field',
  async (body, message) => {
    const { status, data } = await post(body);
    expect(status).toBe(400);
    expect(data.error).toContain(message);
    expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
  }
);

test('POST /lowdefy-docs/mutants answers a page that fails to build with a 422 and its errors', async () => {
  mockBuildPageIfNeeded.mockRejectedValue(new Error('Block type "Buton" not found.'));
  const { status, data } = await post({ pages: ['tickets'] });
  expect(status).toBe(422);
  expect(data.buildErrors).toEqual([
    { type: 'Error', message: 'Block type "Buton" not found.', source: null },
  ]);
});

test('POST /lowdefy-docs/mutants answers with the build id read before the pages built', async () => {
  // An edit lands while the page builds: its keys may be the new build's, so
  // the answer must carry the older id and the journey route refuse it as stale.
  mockBuildPageIfNeeded.mockImplementation(async () => {
    write('buildStatus.json', { status: 'ok', timestamp: '2026-10-03T09:00:00.000Z' });
    return true;
  });
  const { status, data } = await post({ pages: ['tickets'] });
  expect(status).toBe(200);
  expect(data.buildId).toEqual('2026-10-03T08:00:00.000Z');
});
