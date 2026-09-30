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

const mockClientErrors = jest.fn();
jest.unstable_mockModule('./clientErrorStore.js', () => ({ default: { list: mockClientErrors } }));
const mockServerErrors = jest.fn();
jest.unstable_mockModule('./serverErrorStore.js', () => ({ default: { list: mockServerErrors } }));
jest.unstable_mockModule('./getBuildId.js', () => ({ default: () => 'build-2' }));
const mockGetPageBuildStatus = jest.fn(() => ({ unbuilt: 0 }));
jest.unstable_mockModule('./getPageBuildStatus.js', () => ({ default: mockGetPageBuildStatus }));
jest.unstable_mockModule('./readBuildArtifact.js', () => ({
  default: () => ({ status: 'ok', errors: [], warnings: [] }),
}));

const { default: getBuildStatus } = await import('./getBuildStatus.js');

test('getBuildStatus lists errors from earlier builds apart from the current ones', () => {
  mockClientErrors.mockReturnValue([
    { message: 'old render error', buildId: 'build-1' },
    { message: 'live render error', buildId: 'build-2' },
  ]);
  mockServerErrors.mockReturnValue([{ message: 'old request error', buildId: 'build-1' }]);

  const status = getBuildStatus();

  expect(status.clientErrors).toEqual([{ message: 'live render error', buildId: 'build-2' }]);
  expect(status.serverErrors).toEqual([]);
  expect(status.earlierErrors).toEqual({
    note: expect.stringContaining('may already be fixed'),
    clientErrors: [{ message: 'old render error', buildId: 'build-1' }],
    serverErrors: [{ message: 'old request error', buildId: 'build-1' }],
  });
});

test('getBuildStatus leaves out earlierErrors when every error is current', () => {
  mockClientErrors.mockReturnValue([{ message: 'live', buildId: 'build-2' }]);
  mockServerErrors.mockReturnValue([]);

  expect(getBuildStatus().earlierErrors).toBeUndefined();
});

test('getBuildStatus passes the pages build status just built to the page status', () => {
  mockClientErrors.mockReturnValue([]);
  mockServerErrors.mockReturnValue([]);

  const status = getBuildStatus({ checked: ['home'] });

  expect(mockGetPageBuildStatus).toHaveBeenCalledWith({ checked: ['home'] });
  expect(status.pages).toEqual({ unbuilt: 0 });
  expect(status.build.status).toBe('ok');
});
