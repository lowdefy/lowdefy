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

const mockWaitForBuild = jest.fn();
jest.unstable_mockModule('./waitForBuild.js', () => ({ default: mockWaitForBuild }));
const mockBuildEditedPages = jest.fn();
jest.unstable_mockModule('./buildEditedPages.js', () => ({ default: mockBuildEditedPages }));
const mockGetBuildStatus = jest.fn(({ checked } = {}) => ({ build: { status: 'ok' }, checked }));
jest.unstable_mockModule('./getBuildStatus.js', () => ({ default: mockGetBuildStatus }));

const { default: getBuildStatusAfterEdits } = await import('./getBuildStatusAfterEdits.js');

beforeEach(() => {
  jest.clearAllMocks();
});

test('getBuildStatusAfterEdits builds the edited pages once the edits are processed', async () => {
  mockWaitForBuild.mockResolvedValue({ settled: true, sawBuild: false, waitedMs: 1000 });
  mockBuildEditedPages.mockResolvedValue(['home']);

  const result = await getBuildStatusAfterEdits();

  expect(mockWaitForBuild.mock.invocationCallOrder[0]).toBeLessThan(
    mockBuildEditedPages.mock.invocationCallOrder[0]
  );
  expect(result).toEqual({
    settled: true,
    sawBuild: false,
    waitedMs: 1000,
    build: { status: 'ok' },
    checked: ['home'],
  });
});

test('getBuildStatusAfterEdits builds no pages when the wait gave up', async () => {
  mockWaitForBuild.mockResolvedValue({ settled: false, waitedMs: 60000 });

  const result = await getBuildStatusAfterEdits();

  expect(mockBuildEditedPages).not.toHaveBeenCalled();
  expect(result.settled).toBe(false);
  expect(result.checked).toBeUndefined();
});
