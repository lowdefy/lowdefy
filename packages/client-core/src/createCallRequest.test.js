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

import { jest } from '@jest/globals';

import createCallRequest from './createCallRequest.js';
import createMemoryStore from './test/createMemoryStore.js';

function createLowdefy(host) {
  return { apiBase: 'https://acme.example.com', buildId: 'b1', _internal: { host }, user: null };
}

function createHost() {
  return {
    fetch: jest.fn(async () => ({
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ response: 'sent' }),
    })),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    sessionStorage: createMemoryStore(),
  };
}

test('callRequest sends a request to its page and request route', async () => {
  const host = createHost();
  const callRequest = createCallRequest(createLowdefy(host));
  await expect(
    callRequest({
      actionId: 'a',
      blockId: 'b',
      pageId: 'jobs',
      payload: { x: 1 },
      requestId: 'save',
    })
  ).resolves.toEqual({ response: 'sent' });
  expect(host.fetch.mock.calls[0][0]).toBe('https://acme.example.com/api/request/jobs/save');
});

test('callRequest hands an offline: queue request to the host request queue', async () => {
  const host = createHost();
  host.requestQueue = { send: jest.fn(async () => ({ response: { queued: true, id: 'q1' } })) };
  const callRequest = createCallRequest(createLowdefy(host));
  await expect(
    callRequest({
      actionId: 'a',
      blockId: 'b',
      offline: 'queue',
      pageId: 'jobs',
      payload: {},
      requestId: 'save',
    })
  ).resolves.toEqual({ response: { queued: true, id: 'q1' } });
  const [queued] = host.requestQueue.send.mock.calls[0];
  expect(queued).toEqual(
    expect.objectContaining({
      body: { actionId: 'a', blockId: 'b', payload: {} },
      buildId: 'b1',
      pageId: 'jobs',
      requestId: 'save',
      url: 'https://acme.example.com/api/request/jobs/save',
    })
  );
  await expect(queued.send()).resolves.toEqual({ response: 'sent' });
});

test('callRequest sends an offline: queue request as usual on a host without a queue', async () => {
  const host = createHost();
  const callRequest = createCallRequest(createLowdefy(host));
  await expect(
    callRequest({ offline: 'queue', pageId: 'jobs', payload: {}, requestId: 'save' })
  ).resolves.toEqual({ response: 'sent' });
});
