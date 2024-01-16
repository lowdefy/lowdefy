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

import _switch from './switch.js';

test('_switch evaluates to true for the first case', () => {
  expect(
    _switch({
      params: {
        branches: [
          { if: true, then: 'A' },
          { if: false, then: 'B' },
        ],
        default: 'C',
      },
      location: 'locationId',
    })
  ).toEqual('A');
});

test('_switch evaluates to the default case', () => {
  expect(
    _switch({
      params: {
        branches: [
          { if: false, then: 'A' },
          { if: false, then: 'B' },
        ],
        default: 'C',
      },
      location: 'locationId',
    })
  ).toEqual('C');
});

test('switch params branches not an array', () => {
  expect(() => _switch({ params: { branches: '1, 0' }, location: 'locationId' })).toThrow(
    'Operator Error: switch takes an array type as input for the branches. Received: {"branches":"1, 0"} at locationId.'
  );
});

test("switch params branches if doesn't evaluate to boolean ", () => {
  expect(() =>
    _switch({ params: { branches: [{ if: '1, 0', then: 'A' }] }, location: 'locationId' })
  ).toThrow(
    'Operator Error: switch takes a boolean type for parameter "if". Received: {"branches":[{"if":"1, 0","then":"A"}]} at locationId.'
  );
});
