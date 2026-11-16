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
import _decimal from './decimal.js';
import { expect, test } from 'vitest';

const location = 'location';

console.error = () => {};

test('_decimal returns the decimal marker', () => {
  expect(_decimal({ params: '19.99', location })).toEqual({ '~dec': '19.99' });
});

test('_decimal keeps the value exactly as written', () => {
  expect(_decimal({ params: '0.10', location })).toEqual({ '~dec': '0.10' });
  expect(_decimal({ params: '-0', location })).toEqual({ '~dec': '-0' });
  expect(_decimal({ params: '+5', location })).toEqual({ '~dec': '+5' });
  expect(_decimal({ params: '.5', location })).toEqual({ '~dec': '.5' });
  expect(_decimal({ params: '5.', location })).toEqual({ '~dec': '5.' });
  expect(_decimal({ params: '1.5E-7', location })).toEqual({ '~dec': '1.5E-7' });
  expect(_decimal({ params: '1e10', location })).toEqual({ '~dec': '1e10' });
});

test('_decimal accepts 34 significant digits', () => {
  const digits = '1234567890123456789012345678.901234';
  expect(_decimal({ params: digits, location })).toEqual({ '~dec': digits });
  expect(_decimal({ params: `-${digits}`, location })).toEqual({ '~dec': `-${digits}` });
});

test('_decimal does not count leading zeros as digits', () => {
  const value = '0.0000000000000000000000000000000000001';
  expect(_decimal({ params: value, location })).toEqual({ '~dec': value });
  expect(_decimal({ params: '000012.50', location })).toEqual({ '~dec': '000012.50' });
});

test('_decimal accepts a decimal marker read earlier and returns it unchanged', () => {
  expect(_decimal({ params: { '~dec': '0.3' }, location })).toEqual({ '~dec': '0.3' });
});

test('_decimal throws for a number and says to quote it', () => {
  expect(() => _decimal({ params: 19.99, location })).toThrow(
    "_decimal takes a decimal as a string, such as _decimal: '19.99'. A number can lose digits before it reaches the operator, so quote it in YAML. Received 19.99."
  );
});

test('_decimal throws for values that are not a string', () => {
  [null, undefined, true, [], {}, { '~dec': 1.5 }, { '~dec': '1', other: 1 }].forEach((params) => {
    expect(() => _decimal({ params, location })).toThrow('_decimal takes a decimal as a string');
  });
});

test('_decimal throws for a string that is not a decimal', () => {
  [
    '',
    ' 1',
    '1 ',
    'abc',
    '1,5',
    '1.2.3',
    '--1',
    '1e',
    'e5',
    '.',
    '0x10',
    'NaN',
    'Infinity',
  ].forEach((params) => {
    expect(() => _decimal({ params, location })).toThrow('_decimal takes a decimal such as');
  });
});

test('_decimal throws for more than 34 significant digits', () => {
  expect(() => _decimal({ params: '12345678901234567890123456789012345', location })).toThrow(
    '_decimal holds at most 34 significant digits'
  );
  expect(() => _decimal({ params: '1.2345678901234567890123456789012345E5', location })).toThrow(
    '_decimal holds at most 34 significant digits'
  );
});
