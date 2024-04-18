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

import subtract from './subtract.js';

test('_subtract param 0 greater than param 1', () => {
  expect(subtract({ params: [1, 1], location: 'locationId' })).toBe(0);
  expect(subtract({ params: [0, -1], location: 'locationId' })).toBe(1);
  expect(subtract({ params: [1, -1], location: 'locationId' })).toBe(2);
  expect(subtract({ params: [0.2, 0.1], location: 'locationId' })).toBe(0.1);
});

test('_subtract params not an array', () => {
  expect(() => subtract({ params: '1, 0', location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array type as input. Received: "1, 0" at locationId.'
  );
});

test('_subtract params array with length 1', () => {
  expect(() => subtract({ params: [1], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of length 2 as input. Received: [1] at locationId.'
  );
});

test('_subtract params array with length 3', () => {
  expect(() => subtract({ params: [1, 2, 3], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of length 2 as input. Received: [1,2,3] at locationId.'
  );
});

test('_subtract params array with non numbers', () => {
  expect(() => subtract({ params: ['1', 1], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of 2 numbers. Received: ["1",1] at locationId.'
  );
  expect(() => subtract({ params: [1, '1'], location: 'locationId' })).toThrow(
    'Operator Error: _subtract takes an array of 2 numbers. Received: [1,"1"] at locationId.'
  );
});
