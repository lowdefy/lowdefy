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

import _cron from './cron.js';

const location = 'locationId';
// A Monday, before the 09:00 occurrence of "0 9 * * 1".
const from = new Date('2024-01-01T00:00:00.000Z');

function isoNext(params) {
  return _cron({ methodName: 'next', params, location }).toISOString();
}

function isoPrevious(params) {
  return _cron({ methodName: 'previous', params, location }).toISOString();
}

test('_cron.next returns the next occurrence as a date', () => {
  const result = _cron({
    methodName: 'next',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC' },
    location,
  });
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString()).toEqual('2024-01-01T09:00:00.000Z');
});

test('_cron.next returns a date in the future when from is not given', () => {
  const before = new Date();
  const result = _cron({ methodName: 'next', params: '*/5 * * * *', location });
  expect(result).toBeInstanceOf(Date);
  expect(result.getTime()).toBeGreaterThan(before.getTime());
});

test('_cron.next accepts an ISO date string as from', () => {
  expect(
    isoNext({ expression: '0 9 * * 1', from: '2024-01-01T00:00:00.000Z', timezone: 'UTC' })
  ).toEqual('2024-01-01T09:00:00.000Z');
});

test('_cron.next evaluates the expression in the given timezone', () => {
  expect(
    isoNext({
      expression: '0 9 * * 1',
      from: new Date('2024-06-10T00:00:00.000Z'),
      timezone: 'America/New_York',
    })
  ).toEqual('2024-06-10T13:00:00.000Z');
});

test('_cron.next returns an array of dates when count is greater than one', () => {
  const result = _cron({
    methodName: 'next',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC', count: 3 },
    location,
  });
  expect(result.map((date) => date.toISOString())).toEqual([
    '2024-01-01T09:00:00.000Z',
    '2024-01-08T09:00:00.000Z',
    '2024-01-15T09:00:00.000Z',
  ]);
});

test('_cron.next returns a single date when count is one', () => {
  const result = _cron({
    methodName: 'next',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC', count: 1 },
    location,
  });
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString()).toEqual('2024-01-01T09:00:00.000Z');
});

test('_cron.next takes the cron expression as a string', () => {
  const result = _cron({ methodName: 'next', params: '0 0 1 1 *', location });
  expect(result).toBeInstanceOf(Date);
});

test('_cron.next throws when the expression is missing', () => {
  expect(() => _cron({ methodName: 'next', params: { from }, location })).toThrow(
    '_cron.next requires a cron expression string. Received undefined.'
  );
});

test('_cron.next throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'next', params: 'every monday', location })).toThrow(
    '_cron.next could not parse the cron expression "every monday".'
  );
});

test('_cron.next throws when the expression is out of range', () => {
  expect(() => _cron({ methodName: 'next', params: '0 9 * * 8', location })).toThrow(
    '_cron.next could not parse the cron expression "0 9 * * 8". Constraint error, got value 8 expected range 0-7'
  );
});

test('_cron.next throws when from is not a date', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', from: 42 }, location })
  ).toThrow('_cron.next "from" must be a date or a date string. Received 42.');
});

test('_cron.next throws when from is not a resolvable date string', () => {
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from: 'last tuesday' },
      location,
    })
  ).toThrow('_cron.next could not resolve "from" as a date. Received "last tuesday".');
});

test('_cron.next throws when the timezone is not a valid IANA name', () => {
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from, timezone: 'Mars/Olympus' },
      location,
    })
  ).toThrow('_cron.next "timezone" is not a valid IANA timezone name. Received "Mars/Olympus".');
});

test('_cron.next throws when the timezone is not a string', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', timezone: 2 }, location })
  ).toThrow('_cron.next "timezone" must be an IANA timezone name. Received 2.');
});

test('_cron.next throws when count is not a positive integer', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', count: 0 }, location })
  ).toThrow('_cron.next "count" must be an integer greater than zero. Received 0.');
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', count: 1.5 }, location })
  ).toThrow('_cron.next "count" must be an integer greater than zero. Received 1.5.');
});

test('_cron.next throws when params is not a string or object', () => {
  expect(() => _cron({ methodName: 'next', params: null, location })).toThrow(
    '_cron.next accepts one of the following types: string, object.'
  );
});

test('_cron.previous returns the previous occurrence as a date', () => {
  const result = _cron({
    methodName: 'previous',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC' },
    location,
  });
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString()).toEqual('2023-12-25T09:00:00.000Z');
});

test('_cron.previous returns an array of dates, most recent first, when count is greater than one', () => {
  const result = _cron({
    methodName: 'previous',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC', count: 3 },
    location,
  });
  expect(result.map((date) => date.toISOString())).toEqual([
    '2023-12-25T09:00:00.000Z',
    '2023-12-18T09:00:00.000Z',
    '2023-12-11T09:00:00.000Z',
  ]);
});

test('_cron.previous evaluates the expression in the given timezone', () => {
  expect(
    isoPrevious({
      expression: '0 9 * * 1',
      from: new Date('2024-06-11T00:00:00.000Z'),
      timezone: 'America/New_York',
    })
  ).toEqual('2024-06-10T13:00:00.000Z');
});

test('_cron.previous throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'previous', params: 'every monday', location })).toThrow(
    '_cron.previous could not parse the cron expression "every monday".'
  );
});

test('_cron.describe returns a human readable sentence', () => {
  expect(_cron({ methodName: 'describe', params: '0 9 * * 1', location })).toEqual(
    'At 09:00 AM, only on Monday'
  );
});

test('_cron.describe takes the expression as a named argument', () => {
  expect(
    _cron({ methodName: 'describe', params: { expression: '0 9 * * 1-5' }, location })
  ).toEqual('At 09:00 AM, Monday through Friday');
});

test('_cron.describe describes the expression in the given locale', () => {
  expect(
    _cron({ methodName: 'describe', params: { expression: '0 9 * * 1', locale: 'fr' }, location })
  ).toEqual('À 09:00, uniquement le lundi');
});

test('_cron.describe describes the expression verbosely', () => {
  expect(
    _cron({
      methodName: 'describe',
      params: { expression: '*/5 * * * *', verbose: true },
      location,
    })
  ).toEqual('Every 5 minutes, every hour, every day');
});

test('_cron.describe describes times in the 24 hour format', () => {
  expect(
    _cron({
      methodName: 'describe',
      params: { expression: '0 9 * * 1', use24HourTimeFormat: true },
      location,
    })
  ).toEqual('At 09:00, only on Monday');
});

test('_cron.describe returns an empty string when the expression is missing', () => {
  expect(_cron({ methodName: 'describe', params: null, location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: undefined, location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: '', location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: { expression: null }, location })).toEqual('');
});

test('_cron.describe throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'describe', params: 'every monday', location })).toThrow(
    '_cron.describe could not describe the cron expression "every monday".'
  );
});

test('_cron.describe throws when the expression is not a string', () => {
  expect(() => _cron({ methodName: 'describe', params: { expression: 9 }, location })).toThrow(
    '_cron.describe requires a cron expression string. Received 9.'
  );
});

test('_cron.validate returns true for a valid cron expression', () => {
  expect(_cron({ methodName: 'validate', params: '0 9 * * 1', location })).toBe(true);
  expect(_cron({ methodName: 'validate', params: { expression: '*/5 * * * *' }, location })).toBe(
    true
  );
});

test('_cron.validate returns false for an invalid cron expression', () => {
  expect(_cron({ methodName: 'validate', params: 'every monday', location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: '0 9 * * 8', location })).toBe(false);
});

test('_cron.validate returns false when the expression is missing', () => {
  expect(_cron({ methodName: 'validate', params: null, location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: undefined, location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: { expression: null }, location })).toBe(false);
});

test('_cron.fields returns the parsed cron fields', () => {
  expect(_cron({ methodName: 'fields', params: '0 9 * * 1', location })).toEqual({
    second: { wildcard: false, values: [0] },
    minute: { wildcard: false, values: [0] },
    hour: { wildcard: false, values: [9] },
    dayOfMonth: {
      wildcard: true,
      values: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31,
      ],
    },
    month: { wildcard: true, values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
    dayOfWeek: { wildcard: false, values: [1] },
  });
});

test('_cron.fields throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'fields', params: 'every monday', location })).toThrow(
    '_cron.fields could not parse the cron expression "every monday".'
  );
});

test('_cron throws when no method is given', () => {
  expect(() => _cron({ params: '0 9 * * 1', location })).toThrow(
    '_cron requires a valid method name, use one of the following: next, previous, describe, validate, fields.'
  );
});

test('_cron throws when the method is not supported', () => {
  expect(() => _cron({ methodName: 'after', params: '0 9 * * 1', location })).toThrow(
    '_cron.after is not supported, use one of the following: next, previous, describe, validate, fields.'
  );
});

test('_cron marks next and previous as dynamic', () => {
  expect(_cron.dynamic).toBe(false);
  expect(_cron.meta.next.dynamic).toBe(true);
  expect(_cron.meta.previous.dynamic).toBe(true);
  expect(_cron.meta.describe.dynamic).toBe(undefined);
});
