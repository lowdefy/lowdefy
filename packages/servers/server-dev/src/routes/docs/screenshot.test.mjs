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

const mockScreenshotPage = jest.fn();

jest.unstable_mockModule('../../../lib/docs/screenshotPage.js', () => ({
  default: mockScreenshotPage,
}));

const { default: docsScreenshotHandler } = await import('./screenshot.js');

function createContext(url) {
  const parsed = new URL(url);
  const json = jest.fn((data, status) => ({ data, status: status ?? 200 }));
  const body = jest.fn((data, status, headers) => ({ data, status, headers }));
  return {
    req: {
      url,
      param: () => parsed.pathname.split('/').pop(),
      query: (key) => parsed.searchParams.get(key) ?? undefined,
    },
    json,
    body,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockScreenshotPage.mockResolvedValue({ data: 'cG5n', mimeType: 'image/png' });
});

test('docsScreenshotHandler passes the viewport size and colour scheme to screenshotPage', async () => {
  const c = createContext(
    'http://localhost:3227/lowdefy-docs/screenshot/home?viewportWidth=390&viewportHeight=844&colorScheme=dark'
  );

  const result = await docsScreenshotHandler(c);

  expect(mockScreenshotPage).toHaveBeenCalledWith(
    expect.objectContaining({
      origin: 'http://localhost:3227',
      pageId: 'home',
      width: 390,
      height: 844,
      colorScheme: 'dark',
      clip: undefined,
    })
  );
  expect(result.status).toBe(200);
  expect(result.headers).toEqual({ 'Content-Type': 'image/png' });
});

test('docsScreenshotHandler keeps width and height as the clip, apart from the viewport', async () => {
  const c = createContext(
    'http://localhost:3227/lowdefy-docs/screenshot/home?x=0&y=10&width=200&height=100&viewportWidth=800'
  );

  await docsScreenshotHandler(c);

  expect(mockScreenshotPage).toHaveBeenCalledWith(
    expect.objectContaining({
      clip: { x: 0, y: 10, width: 200, height: 100 },
      width: 800,
      height: undefined,
      colorScheme: undefined,
    })
  );
});

test('docsScreenshotHandler returns 400 for an unknown colour scheme', async () => {
  const c = createContext('http://localhost:3227/lowdefy-docs/screenshot/home?colorScheme=dim');

  const result = await docsScreenshotHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toEqual('Color scheme must be "light" or "dark". Received "dim".');
  expect(mockScreenshotPage).not.toHaveBeenCalled();
});

test('docsScreenshotHandler returns 400 for a viewport width that is not a positive integer', async () => {
  const c = createContext('http://localhost:3227/lowdefy-docs/screenshot/home?viewportWidth=0');

  const result = await docsScreenshotHandler(c);

  expect(result.status).toBe(400);
  expect(result.data.error).toMatch(/Viewport width must be a positive integer/);
});

test.each(['viewportWidth', 'viewportHeight'])(
  'docsScreenshotHandler returns 400 naming a non-numeric %s',
  async (key) => {
    const c = createContext(`http://localhost:3227/lowdefy-docs/screenshot/home?${key}=wide`);

    const result = await docsScreenshotHandler(c);

    expect(result.status).toBe(400);
    expect(result.data.error).toEqual(
      `"${key}" must be a positive integer (CSS pixels). Received "wide".`
    );
    expect(mockScreenshotPage).not.toHaveBeenCalled();
  }
);
