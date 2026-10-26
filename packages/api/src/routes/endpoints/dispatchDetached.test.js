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

import { afterEach, expect, test, vi } from 'vitest';

import dispatchDetached from './dispatchDetached.js';

function respond(status) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: status < 300, status, arrayBuffer: async () => new ArrayBuffer(0) }))
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('dispatchDetached resolves when /api/detached accepts the run', async () => {
  respond(202);
  const response = await dispatchDetached('https://app.example/api/detached/sync', {});
  expect(response.status).toBe(202);
});

test('dispatchDetached throws a ServiceError for a 5xx or 429, which passes with time', async () => {
  respond(503);
  await expect(dispatchDetached('https://app.example/api/detached/sync', {})).rejects.toMatchObject(
    { name: 'ServiceError', statusCode: 503 }
  );
});

test('dispatchDetached throws a plain error with the status for a refusal such as a 401', async () => {
  respond(401);
  await expect(dispatchDetached('https://app.example/api/detached/sync', {})).rejects.toMatchObject(
    { name: 'Error', statusCode: 401 }
  );
});
