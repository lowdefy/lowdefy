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

const mockReviewPageBuilds = jest.fn();
jest.unstable_mockModule('./reviewPageBuilds.js', () => ({
  default: mockReviewPageBuilds,
}));
const mockBuildPageIfNeeded = jest.fn();
jest.unstable_mockModule('../server/jitPageBuilder.js', () => ({
  default: mockBuildPageIfNeeded,
}));

const { default: buildEditedPages } = await import('./buildEditedPages.js');
const { default: getPageBuildStatus } = await import('./getPageBuildStatus.js');

beforeEach(() => {
  jest.clearAllMocks();
});

test('buildEditedPages builds every edited page and returns their ids', async () => {
  mockReviewPageBuilds.mockReturnValue({ edited: ['a', 'b'], unbuilt: ['c'], failed: [] });
  mockBuildPageIfNeeded.mockRejectedValueOnce(new Error('Page "a" build failed.'));
  mockBuildPageIfNeeded.mockResolvedValueOnce(true);

  const checked = await buildEditedPages();

  expect(checked).toEqual(['a', 'b']);
  expect(mockBuildPageIfNeeded.mock.calls.map(([args]) => args.pageId)).toEqual(['a', 'b']);
});

test('getPageBuildStatus reports failed and unbuilt pages', () => {
  const failed = [
    { pageId: 'a', errors: [{ type: 'ConfigError', message: 'Bad.', source: null }] },
  ];
  mockReviewPageBuilds.mockReturnValue({ edited: [], unbuilt: ['c', 'd'], failed });

  expect(getPageBuildStatus()).toEqual({
    failed,
    unbuilt: 2,
    unbuiltNote:
      '2 page(s) have not been built since the dev server started, so this status does not cover them. lowdefy_check validates every page.',
  });
});

test('getPageBuildStatus leaves out empty lists and notes', () => {
  mockReviewPageBuilds.mockReturnValue({ edited: [], unbuilt: [], failed: [] });

  expect(getPageBuildStatus({ checked: [] })).toEqual({ checked: [], unbuilt: 0 });
});

test('getPageBuildStatus says an edited page is not rebuilt yet, or not seen after a wait', () => {
  mockReviewPageBuilds.mockReturnValue({ edited: ['a'], unbuilt: [], failed: [] });

  const before = getPageBuildStatus();
  expect(before.changedSinceBuild).toEqual(['a']);
  expect(before.changedSinceBuildNote).toContain('Call with wait: true');

  const after = getPageBuildStatus({ checked: ['a'] });
  expect(after.checked).toEqual(['a']);
  expect(after.changedSinceBuildNote).toContain('has not rebuilt them');
});
