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

// evalOperator.js only chooses between the tab and headless sources - the
// sources' own behavior is covered by evalOperatorHeadless.test.mjs and (once
// written) evalOperatorInTab's own tests. Mock both, plus tabAvailable, so
// only the fallback logic is under test here.
const mockEvalOperatorInTab = vi.fn();
const mockEvalOperatorHeadless = vi.fn();
const mockTabAvailable = vi.fn();

vi.doMock('./evalOperatorInTab.js', () => ({
  default: mockEvalOperatorInTab,
}));
vi.doMock('./evalOperatorHeadless.js', () => ({
  default: mockEvalOperatorHeadless,
}));
vi.doMock('./tabAvailable.js', () => ({
  default: mockTabAvailable,
}));

const { default: evalOperator } = await import('./evalOperator.js');

beforeEach(() => {
  vi.clearAllMocks();
});

const expression = { _state: 'name' };

test('evalOperator uses the tab when source is "tab" and it succeeds', async () => {
  mockEvalOperatorInTab.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    source: 'tab',
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'tab' });
  expect(mockEvalOperatorInTab).toHaveBeenCalledWith({ pageId: 'home', expression });
  expect(mockEvalOperatorHeadless).not.toHaveBeenCalled();
});

test('evalOperator falls back to headless when source is "tab" but the tab errors', async () => {
  mockEvalOperatorInTab.mockResolvedValue({ error: 'No browser tab connected.' });
  mockEvalOperatorHeadless.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    source: 'tab',
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'headless' });
  expect(mockEvalOperatorHeadless).toHaveBeenCalledWith({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
  });
});

test('evalOperator goes straight to headless when source is "headless"', async () => {
  mockEvalOperatorHeadless.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    source: 'headless',
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'headless' });
  expect(mockTabAvailable).not.toHaveBeenCalled();
  expect(mockEvalOperatorInTab).not.toHaveBeenCalled();
});

test('evalOperator prefers the tab when source is unset and a tab is available', async () => {
  mockTabAvailable.mockReturnValue(true);
  mockEvalOperatorInTab.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'tab' });
  expect(mockEvalOperatorHeadless).not.toHaveBeenCalled();
});

test('evalOperator ignores an available tab and passes the user to headless when a user is given', async () => {
  mockTabAvailable.mockReturnValue(true);
  mockEvalOperatorHeadless.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    user: { roles: ['admin'] },
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'headless' });
  expect(mockEvalOperatorInTab).not.toHaveBeenCalled();
  expect(mockEvalOperatorHeadless).toHaveBeenCalledWith({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    user: { roles: ['admin'] },
  });
});

test('evalOperator errors when a user is combined with source "tab"', async () => {
  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
    source: 'tab',
    user: { roles: ['admin'] },
  });

  expect(result.error).toMatch(/cannot apply "user" to the developer's live tab/);
  // Flagged as the caller's mistake so the HTTP route answers 400, not 502.
  expect(result.invalidInput).toBe(true);
  expect(mockEvalOperatorInTab).not.toHaveBeenCalled();
  expect(mockEvalOperatorHeadless).not.toHaveBeenCalled();
});

test('evalOperator goes straight to headless when source is unset and no tab is available', async () => {
  mockTabAvailable.mockReturnValue(false);
  mockEvalOperatorHeadless.mockResolvedValue({ value: 'Jane', errors: [] });

  const result = await evalOperator({
    origin: 'http://localhost:3001',
    pageId: 'home',
    expression,
  });

  expect(result).toEqual({ value: 'Jane', errors: [], source: 'headless' });
  expect(mockEvalOperatorInTab).not.toHaveBeenCalled();
});
