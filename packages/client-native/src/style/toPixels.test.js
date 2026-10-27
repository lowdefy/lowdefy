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

import toPixels from './toPixels.js';

test('toPixels reads numbers, px and em lengths', () => {
  expect(toPixels({ fontSize: 14, value: 8 })).toBe(8);
  expect(toPixels({ fontSize: 14, value: '12px' })).toBe(12);
  expect(toPixels({ fontSize: 14, value: ' 12 ' })).toBe(12);
  expect(toPixels({ fontSize: 10, value: '1.5em' })).toBe(15);
  expect(toPixels({ fontSize: 10, value: '.5em' })).toBe(5);
  expect(toPixels({ fontSize: 14, value: '-4px' })).toBe(-4);
});

test('toPixels returns undefined for a length with no single point value', () => {
  expect(toPixels({ fontSize: 14, value: '50%' })).toBeUndefined();
  expect(toPixels({ fontSize: 14, value: 'calc(1px + 2px)' })).toBeUndefined();
  expect(toPixels({ fontSize: 14, value: '1.px' })).toBeUndefined();
  expect(toPixels({ fontSize: 14, value: '.' })).toBeUndefined();
  expect(toPixels({ fontSize: 14, value: null })).toBeUndefined();
});

test('toPixels returns undefined for a long run of digits that is no length without backtracking', () => {
  const start = performance.now();
  expect(toPixels({ fontSize: 14, value: `${'0'.repeat(100000)}x` })).toBeUndefined();
  expect(performance.now() - start).toBeLessThan(1000);
});
