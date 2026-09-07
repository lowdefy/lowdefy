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

const mockTabAvailable = jest.fn();

jest.unstable_mockModule('./tabAvailable.js', () => ({
  default: mockTabAvailable,
}));

const { default: resolveSource } = await import('./resolveSource.js');

beforeEach(() => {
  jest.clearAllMocks();
});

test('resolveSource tries the tab when source is "tab"', () => {
  expect(resolveSource({ name: 'inspectState', pageId: 'home', source: 'tab' })).toEqual({
    tryTab: true,
  });
  expect(mockTabAvailable).not.toHaveBeenCalled();
});

test('resolveSource does not try the tab when source is "headless"', () => {
  expect(resolveSource({ name: 'inspectState', pageId: 'home', source: 'headless' })).toEqual({
    tryTab: false,
  });
  expect(mockTabAvailable).not.toHaveBeenCalled();
});

test('resolveSource tries the tab when source is unset and a tab is available', () => {
  mockTabAvailable.mockReturnValue(true);

  expect(resolveSource({ name: 'inspectState', pageId: 'home' })).toEqual({ tryTab: true });
  expect(mockTabAvailable).toHaveBeenCalledWith({ pageId: 'home' });
});

test('resolveSource does not try the tab when source is unset and no tab is available', () => {
  mockTabAvailable.mockReturnValue(false);

  expect(resolveSource({ name: 'inspectState', pageId: 'home' })).toEqual({ tryTab: false });
});

test('resolveSource selects headless over an available tab when a user is given', () => {
  mockTabAvailable.mockReturnValue(true);

  expect(
    resolveSource({ name: 'inspectState', pageId: 'home', user: { roles: ['admin'] } })
  ).toEqual({ tryTab: false });
});

test('resolveSource marks a user combined with source "tab" as invalid input', () => {
  const result = resolveSource({
    name: 'inspectState',
    pageId: 'home',
    source: 'tab',
    user: { roles: ['admin'] },
  });

  expect(result.invalidInput).toBe(true);
  expect(result.error).toBe(
    'inspectState cannot apply "user" to the developer\'s live tab — it carries their real session. Omit "source", or use "headless".'
  );
  expect(result.tryTab).toBeUndefined();
});

test('resolveSource names the calling function in the invalid-input error', () => {
  const result = resolveSource({
    name: 'evalOperator',
    pageId: 'home',
    source: 'tab',
    user: { roles: ['admin'] },
  });

  expect(result.error).toMatch(/^evalOperator cannot apply "user"/);
});

test('resolveSource treats a null user as no user', () => {
  mockTabAvailable.mockReturnValue(true);

  expect(
    resolveSource({ name: 'inspectState', pageId: 'home', source: 'tab', user: null })
  ).toEqual({
    tryTab: true,
  });
});
