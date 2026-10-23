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

import { vi, beforeEach, expect, test } from 'vitest';

import createCallRequest from './createCallRequest.js';
import createMemoryStore from './test/createMemoryStore.js';

let host;

beforeEach(() => {
  host = {
    fetch: vi.fn(),
    onBuildChanged: vi.fn(),
    onCallerChanged: vi.fn(),
    sessionStorage: createMemoryStore(),
  };
});

function createLowdefy() {
  return {
    apiBase: '',
    buildId: null,
    user: null,
    _internal: { host, logger: { warn: vi.fn() } },
  };
}

function textResponse({ status, text }) {
  return {
    ok: false,
    status,
    headers: { get: () => null },
    text: () => Promise.resolve(text),
  };
}

function jsonResponse({ ok = true, status = 200, body }) {
  return {
    ok,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

const platformFailure = textResponse({
  status: 500,
  text: 'A server error has occurred\n\nFUNCTION_INVOCATION_FAILED\n',
});

const call = {
  actionId: 'fetch',
  blockId: 'page',
  pageId: 'tasks',
  payload: {},
  requestId: 'get_tasks',
};

test('callRequest sends a read-only request again when the host fails it with a non-JSON body', async () => {
  host.fetch = vi
    .fn()
    .mockResolvedValueOnce(platformFailure)
    .mockResolvedValueOnce(jsonResponse({ body: { response: [1] } }));
  const lowdefy = createLowdefy();
  const callRequest = createCallRequest(lowdefy);
  await expect(callRequest({ ...call, readOnly: true })).resolves.toEqual({ response: [1] });
  expect(host.fetch).toHaveBeenCalledTimes(2);
  expect(lowdefy._internal.logger.warn).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.warn.mock.calls[0][0]).toContain(
    'Request "get_tasks" on page "tasks" failed with status 500'
  );
});

test('callRequest sends a read-only request again only once', async () => {
  host.fetch = vi.fn().mockResolvedValue(platformFailure);
  const callRequest = createCallRequest(createLowdefy());
  await expect(callRequest({ ...call, readOnly: true })).rejects.toThrow(
    'The server could not answer (status 500). Try again.'
  );
  expect(host.fetch).toHaveBeenCalledTimes(2);
});

test('callRequest never sends a request that may write again', async () => {
  host.fetch = vi.fn().mockResolvedValue(platformFailure);
  const lowdefy = createLowdefy();
  const callRequest = createCallRequest(lowdefy);
  await expect(callRequest({ ...call, readOnly: false })).rejects.toThrow(
    'The server could not answer (status 500). Try again.'
  );
  expect(host.fetch).toHaveBeenCalledTimes(1);
  expect(lowdefy._internal.logger.warn).not.toHaveBeenCalled();
});

test('callRequest does not send a read-only request again after a JSON error from the app', async () => {
  host.fetch = vi
    .fn()
    .mockResolvedValue(
      jsonResponse({ ok: false, status: 500, body: { message: 'Query failed.' } })
    );
  const callRequest = createCallRequest(createLowdefy());
  await expect(callRequest({ ...call, readOnly: true })).rejects.toThrow('Query failed.');
  expect(host.fetch).toHaveBeenCalledTimes(1);
});
