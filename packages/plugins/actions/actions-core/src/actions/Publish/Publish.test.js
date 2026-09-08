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
import Publish from './Publish.js';

const mockPublish = jest.fn();
const methods = { publish: mockPublish };

test('Publish calls publish with payload and websocketId', () => {
  Publish({
    methods,
    params: {
      websocketId: 'chat',
      payload: { text: 'hi' },
    },
  });
  expect(mockPublish.mock.calls).toEqual([[{ payload: { text: 'hi' }, websocketId: 'chat' }]]);
});

test('Publish calls publish with undefined payload when none is given', () => {
  Publish({
    methods,
    params: {
      websocketId: 'chat',
    },
  });
  expect(mockPublish.mock.calls).toEqual([[{ payload: undefined, websocketId: 'chat' }]]);
});

test('Publish throws when params is not an object', () => {
  expect(() => Publish({ methods, params: 'chat' })).toThrow(
    'Publish requires a "websocketId" property.'
  );
  expect(mockPublish).not.toHaveBeenCalled();
});

test('Publish throws when websocketId is missing', () => {
  expect(() => Publish({ methods, params: { payload: { text: 'hi' } } })).toThrow(
    'Publish requires a "websocketId" property.'
  );
  expect(mockPublish).not.toHaveBeenCalled();
});

test('Publish throws when websocketId is not a string', () => {
  expect(() => Publish({ methods, params: { websocketId: 7 } })).toThrow(
    'Publish requires a "websocketId" property.'
  );
  expect(mockPublish).not.toHaveBeenCalled();
});
