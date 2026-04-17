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
import SetState from './SetState.js';

const mockSetState = jest.fn();
const methods = { setState: mockSetState };

beforeEach(() => {
  mockSetState.mockClear();
});

test('SetState passes params through to setState with flash false when not set', () => {
  SetState({ methods, params: { key: 'value' } });
  expect(mockSetState.mock.calls).toEqual([[{ key: 'value' }, { flash: false }]]);
});

test('SetState destructures flash out of params and passes it as option', () => {
  SetState({ methods, params: { flash: true, key: 'value', other: 1 } });
  expect(mockSetState.mock.calls).toEqual([[{ key: 'value', other: 1 }, { flash: true }]]);
});

test('SetState coerces flash to boolean', () => {
  SetState({ methods, params: { flash: 'truthy', key: 'value' } });
  expect(mockSetState.mock.calls).toEqual([[{ key: 'value' }, { flash: true }]]);
});
