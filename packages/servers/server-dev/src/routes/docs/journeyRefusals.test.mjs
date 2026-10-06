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

// The real runner refuses these journeys before it fetches a browser; the mock
// proves it never gets that far.
const mockGetBrowser = jest.fn();
jest.unstable_mockModule('../../../lib/docs/getBrowser.js', () => ({
  getBrowser: mockGetBrowser,
  openPage: jest.fn(),
  buildPageUrl: jest.fn(),
}));
jest.unstable_mockModule('../../../lib/build/config.js', () => ({ default: { basePath: '' } }));
jest.unstable_mockModule('../../../lib/docs/getBuildId.js', () => ({
  default: jest.fn(() => 'build-1'),
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

test('POST /lowdefy-docs/journey answers 400 for a placeholder value (from: shape)', async () => {
  const result = await docsJourneyHandler(
    createContext({
      pageId: 'form',
      steps: [{ fill: { blockId: 'title', value: null, from: 'shape' } }],
    })
  );
  expect(result.status).toBe(400);
  expect(result.data.error).toMatch('has a placeholder value (from: shape)');
  expect(mockGetBrowser).not.toHaveBeenCalled();
});

test('POST /lowdefy-docs/journey answers 400 for an email step on a server with no mail sink', async () => {
  const previous = process.env.LOWDEFY_SERVER_DEV_MAIL_SINK;
  delete process.env.LOWDEFY_SERVER_DEV_MAIL_SINK;
  try {
    const result = await docsJourneyHandler(
      createContext({ pageId: 'form', steps: [{ email: { to: 'ada@example.test' } }] })
    );
    expect(result.status).toBe(400);
    expect(result.data.error).toMatch('this dev server captures no mail');
    expect(mockGetBrowser).not.toHaveBeenCalled();
  } finally {
    if (previous !== undefined) {
      process.env.LOWDEFY_SERVER_DEV_MAIL_SINK = previous;
    }
  }
});
