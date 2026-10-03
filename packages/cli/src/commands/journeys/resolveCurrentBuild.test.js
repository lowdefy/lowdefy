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

const mockGet = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: { get: mockGet } }));
const mockReadDevInstance = jest.fn();
jest.unstable_mockModule('@lowdefy/node-utils', () => ({ readDevInstance: mockReadDevInstance }));

const { default: resolveCurrentBuild } = await import('./resolveCurrentBuild.js');

const context = { directories: { config: '/app' } };
const records = [
  { build: '2026-10-03T08:00:00.000Z' },
  { build: '2026-10-03T09:30:00.000Z' },
  { build: null },
  { build: '2026-10-03T09:00:00.000Z' },
];

test('resolveCurrentBuild returns the buildId the live dev server reports', async () => {
  mockReadDevInstance.mockReturnValue({ url: 'http://localhost:3111', state: 'ready' });
  mockGet.mockResolvedValue({ data: { buildId: '2026-10-03T10:00:00.000Z' } });
  await expect(resolveCurrentBuild({ context, records })).resolves.toEqual({
    buildId: '2026-10-03T10:00:00.000Z',
    from: 'server',
  });
  expect(mockReadDevInstance).toHaveBeenCalledWith({ configDirectory: '/app' });
  expect(mockGet).toHaveBeenCalledWith('http://localhost:3111/lowdefy-docs/build-status', {
    timeout: 2000,
  });
});

test('resolveCurrentBuild falls back to the newest build in the records with no dev server', async () => {
  mockReadDevInstance.mockReturnValue(null);
  await expect(resolveCurrentBuild({ context, records })).resolves.toEqual({
    buildId: '2026-10-03T09:30:00.000Z',
    from: 'records',
  });
  expect(mockGet).not.toHaveBeenCalled();
});

test('resolveCurrentBuild returns a null buildId with no dev server and no builds in the records', async () => {
  mockReadDevInstance.mockReturnValue(null);
  await expect(resolveCurrentBuild({ context, records: [{ build: null }] })).resolves.toEqual({
    buildId: null,
    from: 'records',
  });
});

test('resolveCurrentBuild falls back to the records when the recorded server does not answer', async () => {
  mockReadDevInstance.mockReturnValue({ url: 'http://localhost:3111', state: 'ready' });
  mockGet.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3111'));
  await expect(resolveCurrentBuild({ context, records })).resolves.toEqual({
    buildId: '2026-10-03T09:30:00.000Z',
    from: 'records',
  });
});

test('resolveCurrentBuild falls back to the records when the server has no build yet', async () => {
  mockReadDevInstance.mockReturnValue({ url: 'http://localhost:3111', state: 'ready' });
  mockGet.mockResolvedValue({ data: { buildId: null } });
  await expect(resolveCurrentBuild({ context, records })).resolves.toEqual({
    buildId: '2026-10-03T09:30:00.000Z',
    from: 'records',
  });
});
