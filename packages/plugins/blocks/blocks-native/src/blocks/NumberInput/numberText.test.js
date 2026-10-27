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

import formatNumber from './formatNumber.js';
import normalizeNumber from './normalizeNumber.js';
import parseNumberText from './parseNumberText.js';

test('parseNumberText reads numbers, empty text and text on its way to a number', () => {
  expect(parseNumberText({ text: '' })).toEqual({ valid: true, value: null });
  expect(parseNumberText({ text: '12.5' })).toEqual({ valid: true, value: 12.5 });
  expect(parseNumberText({ text: '1.' })).toEqual({ valid: true, value: 1 });
  expect(parseNumberText({ text: '-' })).toEqual({ valid: false, value: null });
  expect(parseNumberText({ text: '1a' })).toEqual({ valid: false, value: null });
  expect(parseNumberText({ decimalSeparator: ',', text: '3,25' })).toEqual({
    valid: true,
    value: 3.25,
  });
});

test('parseNumberText reads a long run of digits that is no number as not valid without backtracking', () => {
  const start = performance.now();
  expect(parseNumberText({ text: `${'0'.repeat(100000)}x` })).toEqual({
    valid: false,
    value: null,
  });
  expect(performance.now() - start).toBeLessThan(1000);
});

test('formatNumber fixes precision and uses the decimal separator', () => {
  expect(formatNumber({ value: null })).toBe('');
  expect(formatNumber({ value: 2, precision: 2 })).toBe('2.00');
  expect(formatNumber({ value: 2.5, decimalSeparator: ',' })).toBe('2,5');
});

test('normalizeNumber clamps and rounds', () => {
  expect(normalizeNumber({ value: 12, max: 10 })).toBe(10);
  expect(normalizeNumber({ value: -3, min: 0 })).toBe(0);
  expect(normalizeNumber({ value: 1.256, precision: 2 })).toBe(1.26);
  expect(normalizeNumber({ value: null })).toBeNull();
});
