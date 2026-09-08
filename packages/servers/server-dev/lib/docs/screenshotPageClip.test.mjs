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

// Covers the clip/scroll success path, which screenshotPage.test.mjs cannot
// (it deliberately fails chromium.launch to test the "no browser" error
// path). Mocking the whole ./getBrowser.js module — not just
// playwright-core — means lib/build/config.js (which getBrowser.js reads at
// import time) is never touched, so no fixture chdir is needed here.
const mockScreenshot = jest.fn(async () => Buffer.from('fake-png'));
const mockWaitForTimeout = jest.fn(async () => {});
const mockEvaluate = jest.fn(async () => {});
const mockPage = {
  screenshot: mockScreenshot,
  waitForTimeout: mockWaitForTimeout,
  evaluate: mockEvaluate,
};
const mockContext = { close: jest.fn(async () => {}) };
const mockOpenPage = jest.fn(async () => ({
  context: mockContext,
  page: mockPage,
  url: 'http://localhost:3001/home',
}));
const mockGetBrowser = jest.fn(async () => ({}));

jest.unstable_mockModule('./getBrowser.js', () => ({
  getBrowser: mockGetBrowser,
  openPage: mockOpenPage,
  buildPageUrl: jest.fn(() => 'http://localhost:3001/home'),
}));

const { default: screenshotPage } = await import('./screenshotPage.js');

test('screenshotPage with a valid clip scrolls to scrollX/scrollY and converts clip to document coordinates', async () => {
  const result = await screenshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    clip: { x: 220, y: 480, width: 96, height: 40 },
    scrollX: 10,
    scrollY: 340,
  });

  expect(result.error).toBeUndefined();
  expect(mockEvaluate).toHaveBeenCalledWith(expect.any(Function), { x: 10, y: 340 });
  expect(mockScreenshot).toHaveBeenCalledWith({
    type: 'png',
    clip: { x: 230, y: 820, width: 96, height: 40 },
  });
});

test('screenshotPage without a clip takes a normal fullPage/viewport screenshot and never scrolls', async () => {
  const result = await screenshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    fullPage: true,
  });

  expect(result.error).toBeUndefined();
  expect(mockEvaluate).not.toHaveBeenCalled();
  expect(mockScreenshot).toHaveBeenCalledWith({ type: 'png', fullPage: true });
});

test('screenshotPage ignores a clip with non-positive dimensions and falls back to a viewport screenshot', async () => {
  const result = await screenshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    clip: { x: 0, y: 0, width: 0, height: 40 },
  });

  expect(result.error).toBeUndefined();
  expect(mockEvaluate).not.toHaveBeenCalled();
  expect(mockScreenshot).toHaveBeenCalledWith({ type: 'png', fullPage: false });
});

test('screenshotPage clip takes priority over fullPage when both are provided', async () => {
  const result = await screenshotPage({
    origin: 'http://localhost:3001',
    pageId: 'home',
    fullPage: true,
    clip: { x: 1, y: 2, width: 3, height: 4 },
  });

  expect(result.error).toBeUndefined();
  expect(mockScreenshot).toHaveBeenCalledWith({
    type: 'png',
    clip: { x: 1, y: 2, width: 3, height: 4 },
  });
});
