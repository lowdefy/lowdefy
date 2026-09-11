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

const mockBuildPageIfNeeded = jest.fn();
jest.unstable_mockModule('./jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
  getPageJitEnrichment: jest.fn(() => ({})),
}));

const { default: createJitReadConfigFile } = await import('./createJitReadConfigFile.js');
const { getPageConfig } = await import('@lowdefy/api');

const directories = { buildDirectory: '/build', configDirectory: '/config' };
const pageConfig = { id: 'page:report', pageId: 'report', type: 'Box', auth: { public: true } };

// A build directory where the page JSON appears only once the JIT build ran.
function createUnbuiltReader() {
  const files = {};
  mockBuildPageIfNeeded.mockImplementation(async ({ pageId }) => {
    if (pageId !== 'report') return false;
    files[`pages/${pageId}.json`] = pageConfig;
    return { built: true };
  });
  return jest.fn(async (filePath) => files[filePath] ?? null);
}

afterEach(() => {
  mockBuildPageIfNeeded.mockReset();
});

test('an unbuilt page is built JIT and then read, the way the page route does it', async () => {
  const readConfigFile = createUnbuiltReader();
  const jitRead = createJitReadConfigFile({ readConfigFile, ...directories });
  await expect(jitRead('pages/report.json')).resolves.toEqual(pageConfig);
  expect(mockBuildPageIfNeeded).toHaveBeenCalledWith({ pageId: 'report', ...directories });
  expect(readConfigFile).toHaveBeenCalledTimes(2);
});

test('RenderReport succeeds against an unbuilt page in dev: app.getPageConfig returns the config', async () => {
  const context = {
    readConfigFile: createJitReadConfigFile({
      readConfigFile: createUnbuiltReader(),
      ...directories,
    }),
    authorize: () => true,
  };
  const result = await getPageConfig(context, { pageId: 'report', urlQuery: {} });
  expect(result).not.toBeNull();
  expect(result.pageId).toBe('report');
  expect(result.auth).toBeUndefined();
});

test('an unknown page stays null so a report is never an existence oracle', async () => {
  const jitRead = createJitReadConfigFile({
    readConfigFile: createUnbuiltReader(),
    ...directories,
  });
  await expect(jitRead('pages/missing.json')).resolves.toBeNull();
  expect(mockBuildPageIfNeeded).toHaveBeenCalledWith({ pageId: 'missing', ...directories });
});

test('a built page reads straight through without a build', async () => {
  const readConfigFile = jest.fn(async () => pageConfig);
  const jitRead = createJitReadConfigFile({ readConfigFile, ...directories });
  await expect(jitRead('pages/report.json')).resolves.toEqual(pageConfig);
  expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
});

test('non-page artifacts and per-request artifacts never trigger a build', async () => {
  const readConfigFile = jest.fn(async () => null);
  const jitRead = createJitReadConfigFile({ readConfigFile, ...directories });
  await expect(jitRead('global.json')).resolves.toBeNull();
  await expect(jitRead('pages/report/requests/getData.json')).resolves.toBeNull();
  expect(mockBuildPageIfNeeded).not.toHaveBeenCalled();
});
