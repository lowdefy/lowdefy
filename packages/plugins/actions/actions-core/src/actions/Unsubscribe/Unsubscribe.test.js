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
import Unsubscribe from './Unsubscribe.js';

const mockUnsubscribe = jest.fn();
const methods = { unsubscribe: mockUnsubscribe };

test('Unsubscribe with a string param calls unsubscribe with the websocketId', () => {
  Unsubscribe({ methods, params: 'ticker' });
  expect(mockUnsubscribe.mock.calls).toEqual([[{ websocketId: 'ticker' }]]);
});

test('Unsubscribe with an object param calls unsubscribe with the websocketId', () => {
  Unsubscribe({ methods, params: { websocketId: 'ticker' } });
  expect(mockUnsubscribe.mock.calls).toEqual([[{ websocketId: 'ticker' }]]);
});

test('Unsubscribe throws when websocketId is missing', () => {
  expect(() => Unsubscribe({ methods, params: undefined })).toThrow(
    'Unsubscribe requires a "websocketId" property.'
  );
  expect(() => Unsubscribe({ methods, params: {} })).toThrow(
    'Unsubscribe requires a "websocketId" property.'
  );
  expect(mockUnsubscribe).not.toHaveBeenCalled();
});

test('Unsubscribe throws when websocketId is not a string', () => {
  expect(() => Unsubscribe({ methods, params: { websocketId: 7 } })).toThrow(
    'Unsubscribe requires a "websocketId" property.'
  );
  expect(mockUnsubscribe).not.toHaveBeenCalled();
});
