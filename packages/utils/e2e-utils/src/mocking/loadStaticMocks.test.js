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

vi.doMock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

async function loadMocks(content) {
  const { default: fs } = await import('fs');
  const { default: loadStaticMocks } = await import('./loadStaticMocks.js');
  fs.existsSync.mockReturnValue(true);
  fs.readFileSync.mockReturnValue(content);
  return loadStaticMocks('/app/e2e/mocks.yaml');
}

test('loadStaticMocks returns no mocks when there is no mocks file', async () => {
  const { default: fs } = await import('fs');
  const { default: loadStaticMocks } = await import('./loadStaticMocks.js');
  fs.existsSync.mockReturnValue(false);
  expect(loadStaticMocks('/app/e2e/mocks.yaml')).toEqual({ requests: [], api: [] });
  expect(loadStaticMocks(undefined)).toEqual({ requests: [], api: [] });
});

test('loadStaticMocks reads requests, api mocks and the default user', async () => {
  const mocks = await loadMocks(`user:
  name: Test User
  roles:
    - admin
requests:
  - requestId: fetch_data
    response: []
api:
  - endpointId: external_api
    method: POST
    response:
      total: 0
`);
  expect(mocks).toEqual({
    user: { name: 'Test User', roles: ['admin'] },
    requests: [{ requestId: 'fetch_data', response: [] }],
    api: [{ endpointId: 'external_api', method: 'POST', response: { total: 0 } }],
  });
});

test('loadStaticMocks returns no mocks for an empty mocks file', async () => {
  expect(await loadMocks('')).toEqual({ requests: [], api: [], user: null });
});

test('loadStaticMocks returns no mocks for a mocks file with only comments', async () => {
  expect(await loadMocks('# requests:\n#   - requestId: fetch_data\n')).toEqual({
    requests: [],
    api: [],
    user: null,
  });
});

test('loadStaticMocks returns no mocks for keys with no entries', async () => {
  expect(await loadMocks('requests:\napi:\n')).toEqual({ requests: [], api: [], user: null });
});

test('loadStaticMocks merges << merge keys', async () => {
  const mocks = await loadMocks(`requests:
  - requestId: fetch_user
    response: &user
      name: Ada
      role: admin
  - requestId: fetch_owner
    response:
      <<: *user
      role: owner
`);
  expect(mocks.requests[1].response).toEqual({ name: 'Ada', role: 'owner' });
});

test('loadStaticMocks loads unquoted dates and date-times as Date objects', async () => {
  const mocks = await loadMocks(`requests:
  - requestId: fetch_order
    response:
      created: 2026-01-15T10:00:00Z
      due: 2026-02-01
      label: '2026-03-01'
`);
  expect(mocks.requests[0].response).toEqual({
    created: new Date('2026-01-15T10:00:00Z'),
    due: new Date('2026-02-01T00:00:00Z'),
    label: '2026-03-01',
  });
});

test('loadStaticMocks throws when the mocks file has more than one YAML document', async () => {
  await expect(loadMocks('requests: []\n---\napi: []\n')).rejects.toThrow(
    'Mocks file "/app/e2e/mocks.yaml" has 2 YAML documents. Put all mocks in one document.'
  );
});
