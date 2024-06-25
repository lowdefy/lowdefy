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

import nunjucks from 'nunjucks';
import uniqueFilter from './uniqueFilter.js';

export const nunjucksEnv = new nunjucks.Environment();
nunjucksEnv.addFilter('unique', uniqueFilter);

describe('uniqueFilter', () => {
  test('should return unique values from an array of primitives', () => {
    const input = [1, 2, 2, 3, 4, 4, 4, 5];
    const output = uniqueFilter(input);
    expect(output).toEqual([1, 2, 3, 4, 5]);
  });

  test('should return unique values from an array of strings', () => {
    const input = ['a', 'b', 'b', 'c', 'a'];
    const output = uniqueFilter(input);
    expect(output).toEqual(['a', 'b', 'c']);
  });

  test('should return the same array when all values are unique', () => {
    const input = [1, 2, 3, 4, 5];
    const output = uniqueFilter(input);
    expect(output).toEqual([1, 2, 3, 4, 5]);
  });

  test('should return an empty array when input is an empty array', () => {
    const input = [];
    const output = uniqueFilter(input);
    expect(output).toEqual([]);
  });

  test('should return the input when input is not an array', () => {
    expect(uniqueFilter(123)).toBe(123);
    expect(uniqueFilter('abc')).toBe('abc');
    expect(uniqueFilter({ a: 1 })).toEqual({ a: 1 });
    expect(uniqueFilter(null)).toBe(null);
    expect(uniqueFilter(undefined)).toBe(undefined);
  });

  test('should handle an array with mixed types', () => {
    const input = [1, '1', 1, 'a', 'a', {}, {}, []];
    const output = uniqueFilter(input);
    expect(output).toEqual([1, '1', 'a', input[5], input[6], input[7]]);
  });

  test('should install unique filter in nunjucks and return unique values', () => {
    const templateString = '{{ value | unique | dump }}';
    const input = [1, 2, 2, 3, 4, 4, 4, 5];
    const output = nunjucksEnv.renderString(templateString, { value: input });
    expect(output).toBe('[1,2,3,4,5]');
  });
});
