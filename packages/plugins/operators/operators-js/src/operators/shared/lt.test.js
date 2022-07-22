/*
  Copyright 2020-2022 Lowdefy, Inc

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

import lt from './lt.js';

test('_lt param 0 less than param 1', () => {
  expect(lt({ params: [0, 1] })).toBe(true);
  expect(lt({ params: [-1, 0] })).toBe(true);
  expect(lt({ params: [-1, 1] })).toBe(true);
  expect(lt({ params: [0.1, 0.2] })).toBe(true);
  expect(lt({ params: [null, 1] })).toBe(true);
  expect(lt({ params: [new Date(1), new Date(2)] })).toBe(true);
  expect(lt({ params: [null, new Date(2)] })).toBe(true);
  expect(lt({ params: [false, true] })).toBe(true);
  expect(lt({ params: ['a', 'b'] })).toBe(true);
  expect(lt({ params: ['aa', 'b'] })).toBe(true);
  expect(lt({ params: ['b', 'bb'] })).toBe(true);
});

test('_lt param 0 greater than param 1', () => {
  expect(lt({ params: [1, 1] })).toBe(false);
  expect(lt({ params: [1, 0] })).toBe(false);
  expect(lt({ params: [0, -1] })).toBe(false);
  expect(lt({ params: [1, -1] })).toBe(false);
  expect(lt({ params: [0.2, 0.1] })).toBe(false);
  expect(lt({ params: [1, null] })).toBe(false);
  expect(lt({ params: [null, null] })).toBe(false);
  expect(lt({ params: [new Date(2), new Date(1)] })).toBe(false);
  expect(lt({ params: [new Date(2), null] })).toBe(false);
  expect(lt({ params: ['bbb', 'bb'] })).toBe(false);
  expect(lt({ params: ['b', 'b'] })).toBe(false);
  expect(lt({ params: [new Date(1), new Date(1)] })).toBe(false);
});

test('_lt params not an array', () => {
  expect(() => lt({ params: '1, 0' })).toThrow('_lt takes an array type as input.');
});

test('_lt params array with length 1', () => {
  expect(() => lt({ params: [1] })).toThrow('_lt takes an array of length 2 as input.');
});

test('_lt params array with length 3', () => {
  expect(() => lt({ params: [1, 2, 3] })).toThrow('_lt takes an array of length 2 as input.');
});
