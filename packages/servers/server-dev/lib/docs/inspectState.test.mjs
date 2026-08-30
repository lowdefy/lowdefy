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
const mockReadPageArtifact = jest.fn();

jest.unstable_mockModule('./inspectStateFromTab.js', () => ({
  default: mockInspectStateFromTab,
}));
jest.unstable_mockModule('./inspectStateHeadless.js', () => ({
  default: mockInspectStateHeadless,
}));
jest.unstable_mockModule('./tabAvailable.js', () => ({
  default: mockTabAvailable,
}));
jest.unstable_mockModule('./readPageArtifact.js', () => ({
  default: mockReadPageArtifact,
}));

const { default: inspectState } = await import('./inspectState.js');

beforeEach(() => {
  jest.clearAllMocks();
  mockReadPageArtifact.mockReturnValue({ id: 'page:home' });
});

test('inspectState uses the tab when source is "tab" and it succeeds', async () => {
  mockInspectStateFromTab.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'tab',
  });

  expect(result).toEqual({ state: { a: 1 }, source: 'tab' });
  expect(mockInspectStateFromTab).toHaveBeenCalledWith({ pageId: 'home' });
  expect(mockInspectStateHeadless).not.toHaveBeenCalled();
});

test('inspectState falls back to headless when source is "tab" but the tab errors', async () => {
  mockInspectStateFromTab.mockResolvedValue({ error: 'No browser tab connected.' });
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'tab',
  });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(mockInspectStateHeadless).toHaveBeenCalledWith({
    origin: 'http://localhost:3001',
    pageId: 'home',
  });
});

test('inspectState goes straight to headless when source is "headless"', async () => {
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'headless',
  });

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

test('inspectState ignores an available tab and passes the user to headless when a user is given', async () => {
  mockTabAvailable.mockReturnValue(true);
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    user: { roles: ['admin'] },
  });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(mockInspectStateFromTab).not.toHaveBeenCalled();
  expect(mockInspectStateHeadless).toHaveBeenCalledWith({
    origin: 'http://localhost:3001',
    pageId: 'home',
    user: { roles: ['admin'] },
  });
});

test('inspectState errors when a user is combined with source "tab"', async () => {
  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'tab',
    user: { roles: ['admin'] },
  });

  expect(result.error).toMatch(/cannot apply "user" to the developer's live tab/);
  // Flagged as the caller's mistake so the HTTP route answers 400, not 502.
  expect(result.invalidInput).toBe(true);
  expect(mockInspectStateFromTab).not.toHaveBeenCalled();
  expect(mockInspectStateHeadless).not.toHaveBeenCalled();
});

const stateSchema = {
  'data.status': { enum: ['draft', 'submitted'] },
  count: { type: 'number' },
};

test('inspectState attaches an empty stateSchemaDrift when state conforms to the page contract', async () => {
  mockReadPageArtifact.mockReturnValue({ id: 'page:home', stateSchema });
  mockInspectStateHeadless.mockResolvedValue({ state: { data: { status: 'draft' }, count: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'headless',
  });

  expect(mockReadPageArtifact).toHaveBeenCalledWith({ pageId: 'home' });
  expect(result).toEqual({
    state: { data: { status: 'draft' }, count: 1 },
    source: 'headless',
    stateSchemaDrift: [],
  });
});

test('inspectState reports stateSchemaDrift entries when live state violates the contract', async () => {
  mockReadPageArtifact.mockReturnValue({ id: 'page:home', stateSchema });
  mockInspectStateFromTab.mockResolvedValue({ state: { data: { status: 'nope' }, count: '1' } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'tab',
  });

  expect(result.source).toEqual('tab');
  expect(result.stateSchemaDrift).toEqual([
    { path: 'count', message: 'must be number', declared: { type: 'number' }, received: '1' },
    {
      path: 'data.status',
      message: 'must be equal to one of the allowed values',
      declared: { enum: ['draft', 'submitted'] },
      received: 'nope',
    },
  ]);
});

test('inspectState omits stateSchemaDrift when the page declares no contract', async () => {
  mockInspectStateHeadless.mockResolvedValue({ state: { a: 1 } });

  const result = await inspectState({
    origin: 'http://localhost:3001',
    pageId: 'home',
    source: 'headless',
  });

  expect(result).toEqual({ state: { a: 1 }, source: 'headless' });
  expect(result).not.toHaveProperty('stateSchemaDrift');
});
