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

import validateCronExpression from './validateCronExpression.js';

test('validateCronExpression accepts valid expressions', () => {
  expect(validateCronExpression('0 6 * * *')).toBe(null);
  expect(validateCronExpression('*/15 * * * *')).toBe(null);
  expect(validateCronExpression('* * * * *')).toBe(null);
  expect(validateCronExpression('0 0 1 1 *')).toBe(null);
  expect(validateCronExpression('0 9-17 * * *')).toBe(null);
  expect(validateCronExpression('0 0 * * 1')).toBe(null);
  expect(validateCronExpression('0,30 * * * *')).toBe(null);
  expect(validateCronExpression('0 8-18/2 * * *')).toBe(null);
  expect(validateCronExpression('  0 6 * * *  ')).toBe(null);
});

test('validateCronExpression rejects the wrong number of fields', () => {
  expect(validateCronExpression('0 6 * *')).toMatch('exactly 5 fields');
  expect(validateCronExpression('0 6 * * * *')).toMatch('exactly 5 fields');
});

test('validateCronExpression rejects non-string input', () => {
  expect(validateCronExpression(undefined)).toMatch('must be a string');
  expect(validateCronExpression(123)).toMatch('must be a string');
});

test('validateCronExpression rejects out-of-range values', () => {
  expect(validateCronExpression('60 * * * *')).toMatch('out of range');
  expect(validateCronExpression('* 24 * * *')).toMatch('out of range');
  expect(validateCronExpression('* * 32 * *')).toMatch('out of range');
  expect(validateCronExpression('* * * 13 *')).toMatch('out of range');
  expect(validateCronExpression('* * * * 7')).toMatch('out of range');
  expect(validateCronExpression('* * 0 * *')).toMatch('out of range');
});

test('validateCronExpression rejects named values', () => {
  expect(validateCronExpression('0 6 * * MON')).toMatch('named values');
  expect(validateCronExpression('0 6 * JAN *')).toMatch('named values');
});

test('validateCronExpression rejects both day-of-month and day-of-week', () => {
  expect(validateCronExpression('0 6 1 * 1')).toMatch(
    'cannot specify both day-of-month and day-of-week'
  );
});

test('validateCronExpression rejects malformed ranges and steps', () => {
  expect(validateCronExpression('5-1 * * * *')).toMatch('descending range');
  expect(validateCronExpression('*/0 * * * *')).toMatch('invalid step');
  expect(validateCronExpression('1-2-3 * * * *')).toMatch('invalid range');
  expect(validateCronExpression(', * * * *')).toMatch('minute');
});
