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

// inspectState.js only chooses between the tab and headless sources - the
// sources' own behavior is covered by inspectStateHeadless.test.mjs and (once
// written) inspectStateFromTab's own tests. Mock both, plus tabAvailable, so
// only the fallback logic is under test here.
const mockInspectStateFromTab = jest.fn();
const mockInspectStateHeadless = jest.fn();
const mockTabAvailable = jest.fn();

jest.unstable_mockModule('./inspectStateFromTab.js', () => ({
  default: mockInspectStateFromTab,
}));
jest.unstable_mockModule('./inspectStateHeadless.js', () => ({
  default: mockInspectStateHeadless,
}));
jest.unstable_mockModule('./tabAvailable.js', () => ({
  default: mockTabAvailable,
}));

const { default: inspectState } = await import('./inspectState.js');

beforeEach(() => {
  jest.clearAllMocks();
});

test('inspectState uses the tab when source is "tab" and it succeeds', async () => {
  mockInspectStateFromTab.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({ origin: 'http://localhost:3001', pageId: 'home', source: 'tab' });

  expect(result).toEqual({ state: { a: 1 }, source: 'tab' });
  expect(mockInspectStateFromTab).toHaveBeenCalledWith({ pageId: 'home' });
  expect(mockInspectStateHeadless).not.toHaveBeenCalled();
});

test('inspectState falls back to headless when source is "tab" but the tab errors', async () => {
  mockInspectStateFromTab.mockResolvedValue({ error: 'No browser tab connected.' });
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({ origin: 'http://localhost:3001', pageId: 'home', source: 'tab' });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(mockInspectStateHeadless).toHaveBeenCalledWith({ origin: 'http://localhost:3001', pageId: 'home' });
});

test('inspectState goes straight to headless when source is "headless"', async () => {
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({ origin: 'http://localhost:3001', pageId: 'home', source: 'headless' });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(mockTabAvailable).not.toHaveBeenCalled();
  expect(mockInspectStateFromTab).not.toHaveBeenCalled();
});

test('inspectState prefers the tab when source is unset and a tab is available', async () => {
  mockTabAvailable.mockReturnValue(true);
  mockInspectStateFromTab.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({ origin: 'http://localhost:3001', pageId: 'home' });

  expect(result).toEqual({ state: { a: 1 }, source: 'tab' });
  expect(mockInspectStateHeadless).not.toHaveBeenCalled();
});

test('inspectState goes straight to headless when source is unset and no tab is available', async () => {
  mockTabAvailable.mockReturnValue(false);
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({ origin: 'http://localhost:3001', pageId: 'home' });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(mockInspectStateFromTab).not.toHaveBeenCalled();
});
