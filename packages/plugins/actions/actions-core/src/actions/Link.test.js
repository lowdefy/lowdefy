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
import Link from './Link.js';

const mockLink = jest.fn();
const methods = { link: mockLink };

console.log = () => {};

test('Link with params', () => {
  Link({
    methods,
    params: { pageId: 'page-id' },
  });
  expect(mockLink.mock.calls).toEqual([[{ pageId: 'page-id' }]]);
});

test('Link with string pageId as params', () => {
  Link({
    methods,
    params: 'page-id',
  });
  expect(mockLink.mock.calls).toEqual([[{ pageId: 'page-id' }]]);
});

test('Link with string pageId as params', () => {
  Link({
    methods,
    params: 'page-id',
  });
  expect(mockLink.mock.calls).toEqual([[{ pageId: 'page-id' }]]);
});

test('link method throws', () => {
  mockLink.mockImplementationOnce(() => {
    throw new Error('Test error');
  });

  expect(() =>
    Link({
      methods,
      params: 'page-id',
    })
  ).toThrow('Invalid Link, check action params. Received ""page-id"".');
});
