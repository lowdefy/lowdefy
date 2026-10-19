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
import Subscribe from './Subscribe.js';

const mockSubscribe = jest.fn();
const methods = { subscribe: mockSubscribe };

test('Subscribe with a string param calls subscribe with the websocketId', () => {
  Subscribe({ methods, params: 'ticker' });
  expect(mockSubscribe.mock.calls).toEqual([[{ websocketId: 'ticker' }]]);
});

test('Subscribe with an object param calls subscribe with the websocketId', () => {
  Subscribe({ methods, params: { websocketId: 'ticker' } });
  expect(mockSubscribe.mock.calls).toEqual([[{ websocketId: 'ticker' }]]);
});

test('Subscribe throws when websocketId is missing', () => {
  expect(() => Subscribe({ methods, params: undefined })).toThrow(
    'Subscribe requires a "websocketId" property.'
  );
  expect(() => Subscribe({ methods, params: {} })).toThrow(
    'Subscribe requires a "websocketId" property.'
  );
  expect(mockSubscribe).not.toHaveBeenCalled();
});

test('Subscribe throws when websocketId is not a string', () => {
  expect(() => Subscribe({ methods, params: { websocketId: 7 } })).toThrow(
    'Subscribe requires a "websocketId" property.'
  );
  expect(mockSubscribe).not.toHaveBeenCalled();
});
