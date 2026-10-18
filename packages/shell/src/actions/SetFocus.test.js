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

import SetFocus from './SetFocus.js';

function createGlobals(elements) {
  return {
    elements: {
      find: ({ blockId, kind, pageId }) => elements[`${kind}:${pageId}:${blockId}`] ?? null,
    },
  };
}

const methods = { getPageId: () => 'home' };

test('SetFocus focuses the input the block registered on the page', () => {
  const input = { focus: jest.fn() };
  SetFocus({ globals: createGlobals({ 'input:home:name': input }), methods, params: 'name' });
  expect(input.focus).toHaveBeenCalledTimes(1);
});

test('SetFocus leaves a block with nothing to focus alone', () => {
  const other = { focus: jest.fn() };
  expect(() =>
    SetFocus({ globals: createGlobals({ 'input:other:name': other }), methods, params: 'name' })
  ).not.toThrow();
  expect(other.focus).not.toHaveBeenCalled();
});

test('SetFocus takes a block id string', () => {
  expect(() => SetFocus({ globals: createGlobals({}), methods, params: { blockId: 'a' } })).toThrow(
    'SetFocus parameter must be a string.'
  );
});
