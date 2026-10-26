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
import { LowdefyInternalError, RequestError, UserError } from '@lowdefy/errors';

import fetchPage from './fetchPage.js';

const apiBase = 'https://field.example.com';

function answer({ status = 200, body, headers = {} }) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  };
}

function fetchWith(res) {
  return jest.fn(async () => res);
}

test('a page answer is returned with its build and etag', async () => {
  const pageConfig = { id: 'jobs', _buildId: 'b1' };
  const result = await fetchPage({
    apiBase,
    fetchWithAuth: fetchWith(answer({ body: { pageConfig }, headers: { etag: '"p1"' } })),
    path: 'jobs',
  });
  expect(result).toEqual({ page: { buildId: 'b1', etag: '"p1"', pageConfig } });
});

test('lowdefy dev installing plugins is an expected outcome that names them, never a page', async () => {
  const error = await fetchPage({
    apiBase,
    fetchWithAuth: fetchWith(answer({ body: { installing: true, packages: ['@acme/blocks'] } })),
    path: 'jobs',
  }).catch((caught) => caught);
  expect(error).toBeInstanceOf(UserError);
  expect(error.message).toBe(
    'Lowdefy dev is installing @acme/blocks for "/jobs". Try again once the install finishes.'
  );
});

test('an answer with no page config is a fault, never a page', async () => {
  const error = await fetchPage({
    apiBase,
    fetchWithAuth: fetchWith(answer({ body: { pageId: 'jobs' } })),
    path: 'jobs',
  }).catch((caught) => caught);
  expect(error).toBeInstanceOf(LowdefyInternalError);
  expect(error.message).toBe(
    'The app\'s server answered the page request for "/jobs" with no page config.'
  );
});

test('a server error keeps its class and status', async () => {
  const error = await fetchPage({
    apiBase,
    fetchWithAuth: fetchWith(
      answer({
        status: 500,
        body: { '~e': { name: 'RequestError', message: 'Page failed.', isLowdefyError: true } },
      })
    ),
    path: 'jobs',
  }).catch((caught) => caught);
  expect(error).toBeInstanceOf(RequestError);
  expect(error.status).toBe(500);
});
