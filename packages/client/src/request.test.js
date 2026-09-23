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
import { getDevError } from '@lowdefy/engine';

import request from './request.js';

function mockFetchResponse({ ok, body }) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  delete global.fetch;
});

test('request returns the parsed body of a successful response', async () => {
  mockFetchResponse({ ok: true, body: { value: 1 } });
  await expect(request({ url: '/api/test' })).resolves.toEqual({ value: 1 });
});

test('request throws the decoded wire error for an error payload, with its dev error beside it', async () => {
  mockFetchResponse({
    ok: false,
    body: {
      '~e': { name: 'Error', message: 'Something went wrong.', requestId: 'rid-1' },
      devError: { '~e': { name: 'Error', message: 'Session store unreachable.' } },
    },
  });
  let thrown;
  try {
    await request({ url: '/api/test', method: 'POST', body: {} });
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(Error);
  expect(thrown.message).toBe('Something went wrong.');
  expect(thrown.requestId).toBe('rid-1');
  expect(Object.getOwnPropertyNames(thrown)).not.toContain('devError');
  expect(getDevError(thrown).message).toBe('Session store unreachable.');
});

test('request throws the body message for a non-2xx response without an error payload', async () => {
  mockFetchResponse({ ok: false, body: { message: 'Bad gateway.' } });
  await expect(request({ url: '/api/test' })).rejects.toThrow('Bad gateway.');
});
