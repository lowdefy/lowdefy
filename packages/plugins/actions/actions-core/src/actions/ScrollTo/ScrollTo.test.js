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
import ScrollTo from './ScrollTo.js';

// Mock document
const mockDocGetElementById = jest.fn();
const mockElemScrollIntoView = jest.fn();
const document = {
  getElementById: mockDocGetElementById,
};

// Mock window
const mockWindowFocus = jest.fn();
const mockWindowOpen = jest.fn(() => ({ focus: mockWindowFocus }));
const mockWindowScrollTo = jest.fn();
const window = {
  location: { href: '', origin: 'http://lowdefy.com' },
  open: mockWindowOpen,
  scrollTo: mockWindowScrollTo,
};

const globals = { document, window };

test('ScrollTo with no params', () => {
  expect(() => ScrollTo({ globals })).toThrow(
    'Invalid ScrollTo, check action params. Received "undefined".'
  );
});

test('ScrollTo with no blockId', () => {
  ScrollTo({ globals, params: { behavior: 'smooth', top: 0 } });
  expect(mockWindowScrollTo.mock.calls).toEqual([
    [
      {
        behavior: 'smooth',
        top: 0,
      },
    ],
  ]);
});

test('ScrollTo with blockId', () => {
  mockDocGetElementById.mockImplementation((id) => {
    if (id === 'blockId') return { id, scrollIntoView: mockElemScrollIntoView };
  });
  ScrollTo({ globals, params: { blockId: 'blockId' } });
  expect(mockDocGetElementById.mock.calls).toEqual([['blockId']]);
  expect(mockElemScrollIntoView.mock.calls).toEqual([[undefined]]);
});

test('ScrollTo with blockId and options', () => {
  mockDocGetElementById.mockImplementation((id) => {
    if (id === 'blockId') return { id, scrollIntoView: mockElemScrollIntoView };
  });
  ScrollTo({ globals, params: { blockId: 'blockId', options: { behavior: 'smooth' } } });
  expect(mockDocGetElementById.mock.calls).toEqual([['blockId']]);
  expect(mockElemScrollIntoView.mock.calls).toEqual([[{ behavior: 'smooth' }]]);
});

test('ScrollTo with blockId, block not found', () => {
  mockDocGetElementById.mockImplementation((id) => {
    if (id === 'blockId') return { id, scrollIntoView: mockElemScrollIntoView };
  });
  ScrollTo({ globals, params: { blockId: 'not_there' } });
  expect(mockDocGetElementById.mock.calls).toEqual([['not_there']]);
  expect(mockElemScrollIntoView.mock.calls).toEqual([]);
  expect(mockWindowScrollTo.mock.calls).toEqual([]);
});
