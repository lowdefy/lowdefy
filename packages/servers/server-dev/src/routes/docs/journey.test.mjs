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
// running server directory - the artifact is mocked as an app without fixtures.
jest.unstable_mockModule('../../../lib/build/auth.js', () => ({
  default: {},
}));

const mockRunJourney = jest.fn();

jest.unstable_mockModule('../../../lib/docs/runJourney.js', () => ({
  default: mockRunJourney,
}));

const { default: docsJourneyHandler } = await import('./journey.js');

function createContext(body) {
  const request = new Request('http://localhost:3227/lowdefy-docs/journey', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  return { req: { url: request.url, json: () => request.json() }, json };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRunJourney.mockResolvedValue({
    pageId: 'form',
    passed: true,
    steps: [],
    screenshots: [{ name: 'after', data: 'cG5n', mimeType: 'image/png' }],
    state: {},
  });
});

test('docsJourneyHandler runs the journey against the request origin and returns the result', async () => {
  const c = createContext({
    pageId: 'form',
    steps: [{ click: 'submit' }],
    user: { roles: ['admin'] },
    urlQuery: { id: '1' },
  });

  const result = await docsJourneyHandler(c);

  expect(mockRunJourney).toHaveBeenCalledWith(
    expect.objectContaining({
      origin: 'http://localhost:3227',
      pageId: 'form',
      steps: [{ click: 'submit' }],
      user: { roles: ['admin'] },
      urlQuery: { id: '1' },
      fixtures: undefined,
      honoContext: c,
    })
  );
  expect(result.status).toBe(200);
  expect(result.data.passed).toBe(true);
  expect(result.data.screenshots).toEqual([{ name: 'after', data: 'cG5n', mimeType: 'image/png' }]);
});

test('docsJourneyHandler returns a failed journey as 200 data', async () => {
  mockRunJourney.mockResolvedValue({
    pageId: 'form',
    passed: false,
    steps: [{ index: 0, step: { click: 'nope' }, status: 'failed', durationMs: 12 }],
    failure: { index: 0, step: { click: 'nope' }, expected: 'x', actual: 'y', message: 'm' },
    screenshots: [],
    state: {},
  });
  const c = createContext({ pageId: 'form', steps: [{ click: 'nope' }] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(200);
  expect(result.data.passed).toBe(false);
  expect(result.data.failure.index).toBe(0);
});

test('docsJourneyHandler returns 400 when pageId is missing', async () => {
  const c = createContext({ steps: [] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/requires a "pageId" string/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 when steps is not an array', async () => {
  const c = createContext({ pageId: 'form', steps: { click: 'a' } });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/"steps" should be an array of steps/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 naming an unknown step', async () => {
  const c = createContext({ pageId: 'form', steps: [{ hover: 'a' }] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toEqual(
    'Step 0 has unknown key "hover". Steps are: click, fill, set, select, press, wait, screenshot, expect.'
  );
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 400 when urlQuery is not an object', async () => {
  const c = createContext({ pageId: 'form', steps: [], urlQuery: 'id=1' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/"urlQuery" param must be an object/);
});

test('docsJourneyHandler returns 400 when user is malformed', async () => {
  const c = createContext({ pageId: 'form', steps: [], user: 'admin' });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/No dev users are declared/);
  expect(mockRunJourney).not.toHaveBeenCalled();
});

test('docsJourneyHandler returns 502 when the journey could not run', async () => {
  mockRunJourney.mockResolvedValue({ error: 'No Chromium available.' });
  const c = createContext({ pageId: 'form', steps: [] });

  const result = await docsJourneyHandler(c);

  expect(result.status).toBe(502);
  expect(result.data.error).toEqual('No Chromium available.');
});
