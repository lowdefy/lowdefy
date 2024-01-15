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
import DisplayMessage from './DisplayMessage.js';

const mockDisplayMessage = jest.fn();
const methods = { displayMessage: mockDisplayMessage };

console.log = () => {};

test('DisplayMessage with all params', () => {
  DisplayMessage({
    methods,
    params: { status: 'success', content: 'Hello', duration: 2, icon: 'Icon' },
  });
  expect(mockDisplayMessage.mock.calls).toEqual([
    [{ status: 'success', content: 'Hello', duration: 2, icon: 'Icon' }],
  ]);
});

test('DisplayMessage params is not object', () => {
  expect(() => DisplayMessage({ methods, params: 'Message content.' })).toThrow(
    'Invalid DisplayMessage, check action params. Params must be an object, received ""Message content."".'
  );
  expect(() => DisplayMessage({ methods, params: null })).toThrow(
    'Invalid DisplayMessage, check action params. Params must be an object, received "null".'
  );
  expect(() => DisplayMessage({ methods })).toThrow(
    'Invalid DisplayMessage, check action params. Params must be an object, received "undefined".'
  );
});
