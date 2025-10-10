/*
  Copyright 2020-2024 Lowdefy, Inc

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

const mockDocGetElementById = jest.fn();
const document = {
  getElementById: mockDocGetElementById,
};

const globals = { document };

test('SetFocus with no params', () => {
  expect(() => SetFocus({ globals })).toThrow('SetFocus parameter must be a string.');
});

test('SetFocus with params that are not of type string', () => {
  expect(() => SetFocus({ globals })).toThrow('SetFocus parameter must be a string.');
});

test('SetFocus with element id param', () => {
  const blockId = 'blockId';
  mockDocGetElementById.mockImplementation((id) => {
    if (id === blockId) return { id };
  });
  SetFocus({ globals, params: blockId });
  expect(mockDocGetElementById.mock.calls).toEqual([[blockId]]);
});

test('SetFocus focuses on element with valid ID', () => {
  const blockId = 'blockId';
  const mockElement = { id: blockId, focus: jest.fn() };
  mockDocGetElementById.mockReturnValue(mockElement);
  SetFocus({ globals, params: blockId });
  expect(mockDocGetElementById.mock.calls).toEqual([[blockId]]);
  expect(mockElement.focus).toHaveBeenCalledTimes(1);
});

test('SetFocus handles non-existent element ID', () => {
  const nonExistentId = 'nonExistentId';
  mockDocGetElementById.mockReturnValue(null);
  expect(() => SetFocus({ globals, params: nonExistentId })).not.toThrow();
});
