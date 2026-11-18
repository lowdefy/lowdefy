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

import { expect, test, vi } from 'vitest';

import adaptPageBreakBefore from './adaptPageBreakBefore.js';

test('adaptPageBreakBefore passes the node lists as plain arrays in the pdfmake 0.2 order', () => {
  const pageBreakBefore = vi.fn(() => true);
  const currentNode = { id: 'current' };
  const nodeContainer = {
    getFollowingNodesOnPage: () => [{ id: 'following' }],
    getNodesOnNextPage: () => [{ id: 'next' }],
    getPreviousNodesOnPage: () => [{ id: 'previous' }],
  };
  const result = adaptPageBreakBefore(pageBreakBefore)(currentNode, nodeContainer);
  expect(result).toBe(true);
  expect(pageBreakBefore.mock.calls).toEqual([
    [currentNode, [{ id: 'following' }], [{ id: 'next' }], [{ id: 'previous' }]],
  ]);
});

test('adaptPageBreakBefore returns what the app function returns', () => {
  const nodeContainer = {
    getFollowingNodesOnPage: () => [],
    getNodesOnNextPage: () => [],
    getPreviousNodesOnPage: () => [],
  };
  expect(adaptPageBreakBefore(() => false)({}, nodeContainer)).toBe(false);
});
