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

// parseUserParam resolves dev user fixtures, which read build/auth.json from a
// running server directory - the artifact is mocked with one fixture.
jest.unstable_mockModule('../../../lib/build/auth.js', () => ({
  default: { dev: { users: { admin: { id: 'admin', roles: ['admin'] } } } },
}));

const mockSnapshotPage = jest.fn();
jest.unstable_mockModule('../../../lib/docs/snapshotPage.js', () => ({
  default: mockSnapshotPage,
}));

const { default: docsSnapshotHandler } = await import('./snapshot.js');

function createContext({ pageId = 'home', query = {} } = {}) {
  const url = new URL(`http://localhost:3248/lowdefy-docs/snapshot/${pageId}`);
  Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, value));
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return {
    req: {
      url: url.toString(),
      param: () => pageId,
      query: (key) => url.searchParams.get(key) ?? undefined,
    },
    json,
  };
}

const snapshot = {
  pageId: 'home',
  screenshot: 'cG5n',
  dom: '<div id="root"></div>',
  state: {},
  snapshotIgnore: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSnapshotPage.mockResolvedValue(snapshot);
});

test('docsSnapshotHandler snapshots the page against the request origin and returns the JSON', async () => {
  const c = createContext({
    query: { user: 'admin', urlQuery: '{"slug":"x"}', journey: '[{"click":"open"}]' },
  });
  const response = await docsSnapshotHandler(c);
  expect(mockSnapshotPage).toHaveBeenCalledWith({
    origin: 'http://localhost:3248',
    pageId: 'home',
    user: { id: 'admin', roles: ['admin'] },
    urlQuery: { slug: 'x' },
    journey: [{ click: 'open' }],
  });
  expect(response).toEqual({ data: snapshot, status: 200 });
});

test('docsSnapshotHandler passes undefined for absent optional params', async () => {
  await docsSnapshotHandler(createContext());
  expect(mockSnapshotPage).toHaveBeenCalledWith({
    origin: 'http://localhost:3248',
    pageId: 'home',
    user: undefined,
    urlQuery: undefined,
    journey: undefined,
  });
});

test('docsSnapshotHandler returns 400 for an unknown dev user', async () => {
  const response = await docsSnapshotHandler(createContext({ query: { user: 'nobody' } }));
  expect(response.status).toBe(400);
  expect(response.data.error).toMatch(/Unknown dev user "nobody"/);
  expect(mockSnapshotPage).not.toHaveBeenCalled();
});

test('docsSnapshotHandler returns 400 when urlQuery is not JSON', async () => {
  const response = await docsSnapshotHandler(createContext({ query: { urlQuery: 'slug=x' } }));
  expect(response.status).toBe(400);
  expect(response.data.error).toMatch(/"urlQuery" param must be JSON/);
});

test('docsSnapshotHandler returns 400 when urlQuery is not an object', async () => {
  const response = await docsSnapshotHandler(createContext({ query: { urlQuery: '[1]' } }));
  expect(response.status).toBe(400);
  expect(response.data.error).toMatch(/"urlQuery" param must be an object/);
});

test('docsSnapshotHandler returns 400 when journey is not an array', async () => {
  const response = await docsSnapshotHandler(createContext({ query: { journey: '{"click":1}' } }));
  expect(response.status).toBe(400);
  expect(response.data.error).toMatch(/"journey" param must be an array/);
});

test('docsSnapshotHandler returns 422 with the failure when a journey step fails', async () => {
  mockSnapshotPage.mockResolvedValue({
    error: 'Journey step 0 failed before the snapshot was taken: nope',
    failure: { index: 0 },
  });
  const response = await docsSnapshotHandler(
    createContext({ query: { journey: '[{"click":"x"}]' } })
  );
  expect(response.status).toBe(422);
  expect(response.data).toEqual({
    error: 'Journey step 0 failed before the snapshot was taken: nope',
    failure: { index: 0 },
  });
});

test('docsSnapshotHandler returns 502 when the renderer fails', async () => {
  mockSnapshotPage.mockResolvedValue({ error: 'No Chromium available.' });
  const response = await docsSnapshotHandler(createContext());
  expect(response.status).toBe(502);
  expect(response.data.error).toBe('No Chromium available.');
});
