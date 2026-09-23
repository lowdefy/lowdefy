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

import fs from 'fs';
import { createRequire } from 'module';
import path from 'path';

import _cron from './cron.js';
import cronstrueLocales from '../../cronstrueLocales.js';

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
    '_cron.next requires a non-empty cron expression string. Received undefined.'
  );
});

test('_cron.next throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'next', params: 'every monday', location })).toThrow(
    '_cron.next could not evaluate the cron expression "every monday".'
  );
});

test('_cron.next throws when the expression is out of range', () => {
  expect(() => _cron({ methodName: 'next', params: '0 9 * * 8', location })).toThrow(
    '_cron.next could not evaluate the cron expression "0 9 * * 8". Constraint error, got value 8 expected range 0-7'
  );
});

test('_cron.next throws when from is not a date', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', from: 42 }, location })
  ).toThrow('_cron.next "from" must be a date or an ISO 8601 date string. Received 42.');
});

test('_cron.next throws when from is not an ISO 8601 date string', () => {
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from: 'last tuesday' },
      location,
    })
  ).toThrow('_cron.next "from" is not a valid ISO 8601 date string');
  // Engines parse non ISO date strings differently, so they are rejected.
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from: 'January 1, 2024' },
      location,
    })
  ).toThrow('Received "January 1, 2024".');
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from: '2024/01/01' },
      location,
    })
  ).toThrow('Received "2024/01/01".');
});

test('_cron.next throws when from is an ISO 8601 shaped string that is not a real date', () => {
  expect(() =>
    _cron({
      methodName: 'next',
      params: { expression: '0 9 * * 1', from: '2024-13-45' },
      location,
    })
  ).toThrow('_cron.next "from" is not a valid ISO 8601 date string');
});

test('_cron.next accepts ISO 8601 date and date time strings as from', () => {
  expect(isoNext({ expression: '0 9 * * 1', from: '2024-01-01', timezone: 'UTC' })).toEqual(
    '2024-01-01T09:00:00.000Z'
  );
  expect(
    isoNext({ expression: '0 9 * * 1', from: '2024-01-01T02:00+02:00', timezone: 'UTC' })
  ).toEqual('2024-01-01T09:00:00.000Z');
  expect(
    isoNext({ expression: '0 9 * * 1', from: '2024-01-01T08:59:59Z', timezone: 'UTC' })
  ).toEqual('2024-01-01T09:00:00.000Z');
});

test('_cron.next excludes an occurrence exactly at from', () => {
  expect(
    isoNext({ expression: '0 9 * * 1', from: '2024-01-01T09:00:00.000Z', timezone: 'UTC' })
  ).toEqual('2024-01-08T09:00:00.000Z');
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
  ).toThrow('_cron.next "count" must be an integer from 1 to 1000. Received 0.');
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', count: 1.5 }, location })
  ).toThrow('_cron.next "count" must be an integer from 1 to 1000. Received 1.5.');
});

test('_cron.next throws when count is greater than 1000', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 9 * * 1', count: 1001 }, location })
  ).toThrow('_cron.next "count" must be an integer from 1 to 1000. Received 1001.');
  expect(() =>
    _cron({ methodName: 'previous', params: { expression: '0 9 * * 1', count: 1001 }, location })
  ).toThrow('_cron.previous "count" must be an integer from 1 to 1000. Received 1001.');
});

test('_cron.next returns 1000 occurrences when count is 1000', () => {
  const result = _cron({
    methodName: 'next',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC', count: 1000 },
    location,
  });
  expect(result).toHaveLength(1000);
});

test('_cron.next, _cron.previous and _cron.fields throw when the expression is blank', () => {
  ['next', 'previous', 'fields'].forEach((methodName) => {
    expect(() => _cron({ methodName, params: '', location })).toThrow(
      `_cron.${methodName} requires a non-empty cron expression string. Received "".`
    );
    expect(() => _cron({ methodName, params: '   ', location })).toThrow(
      `_cron.${methodName} requires a non-empty cron expression string. Received "   ".`
    );
    expect(() => _cron({ methodName, params: { expression: '   ' }, location })).toThrow(
      `_cron.${methodName} requires a non-empty cron expression string. Received "   ".`
    );
  });
});

test('_cron.next throws when the expression uses the H hash token', () => {
  ['H 9 * * *', '0 H(0-5) * * *', '0 9 * * 1,H', 'H/15 * * * *'].forEach((expression) => {
    expect(() => _cron({ methodName: 'next', params: expression, location })).toThrow(
      `_cron.next does not support the "H" hash token, use explicit values instead. Received ${JSON.stringify(
        expression
      )}.`
    );
  });
  expect(() => _cron({ methodName: 'previous', params: 'H 9 * * *', location })).toThrow(
    '_cron.previous does not support the "H" hash token'
  );
  expect(() => _cron({ methodName: 'fields', params: 'H 9 * * *', location })).toThrow(
    '_cron.fields does not support the "H" hash token'
  );
});

test('_cron.next accepts day names that contain an H', () => {
  expect(isoNext({ expression: '0 9 * * THU', from, timezone: 'UTC' })).toEqual(
    '2024-01-04T09:00:00.000Z'
  );
});

test('_cron.next throws when the expression never occurs', () => {
  expect(() =>
    _cron({ methodName: 'next', params: { expression: '0 0 31 2,4 *', from }, location })
  ).toThrow(
    '_cron.next could not evaluate the cron expression "0 0 31 2,4 *". The expression does not match any date.'
  );
});

test('_cron.next supports aliases, L, # and ?', () => {
  expect(isoNext({ expression: '@daily', from, timezone: 'UTC' })).toEqual(
    '2024-01-02T00:00:00.000Z'
  );
  expect(isoNext({ expression: '0 9 L * *', from, timezone: 'UTC' })).toEqual(
    '2024-01-31T09:00:00.000Z'
  );
  expect(isoNext({ expression: '0 9 * * 5L', from, timezone: 'UTC' })).toEqual(
    '2024-01-26T09:00:00.000Z'
  );
  expect(isoNext({ expression: '0 9 * * 1#2', from, timezone: 'UTC' })).toEqual(
    '2024-01-08T09:00:00.000Z'
  );
  expect(isoNext({ expression: '0 9 ? * 1', from, timezone: 'UTC' })).toEqual(
    '2024-01-01T09:00:00.000Z'
  );
});

test('_cron.next runs a time skipped by a daylight saving spring forward an hour later', () => {
  // Europe/London skips 01:00 to 02:00 local time on 2024-03-31.
  const result = _cron({
    methodName: 'next',
    params: {
      expression: '30 1 * * *',
      from: '2024-03-29T12:00:00Z',
      timezone: 'Europe/London',
      count: 3,
    },
    location,
  });
  expect(result.map((date) => date.toISOString())).toEqual([
    '2024-03-30T01:30:00.000Z', // 01:30 GMT
    '2024-03-31T01:30:00.000Z', // 02:30 BST, 01:30 local does not exist
    '2024-04-01T00:30:00.000Z', // 01:30 BST
  ]);
});

test('_cron.next runs a time repeated by a daylight saving autumn overlap once', () => {
  // Europe/London repeats 01:00 to 02:00 local time on 2024-10-27.
  const result = _cron({
    methodName: 'next',
    params: {
      expression: '30 1 * * *',
      from: '2024-10-25T12:00:00Z',
      timezone: 'Europe/London',
      count: 3,
    },
    location,
  });
  expect(result.map((date) => date.toISOString())).toEqual([
    '2024-10-26T00:30:00.000Z', // 01:30 BST
    '2024-10-27T00:30:00.000Z', // the first 01:30, in BST
    '2024-10-28T01:30:00.000Z', // 01:30 GMT
  ]);
});

test('_cron.next runs an hourly interval through both hours of a daylight saving autumn overlap', () => {
  const result = _cron({
    methodName: 'next',
    params: {
      expression: '0 * * * *',
      from: '2024-10-26T23:30:00Z',
      timezone: 'Europe/London',
      count: 3,
    },
    location,
  });
  expect(result.map((date) => date.toISOString())).toEqual([
    '2024-10-27T00:00:00.000Z', // 01:00 BST
    '2024-10-27T01:00:00.000Z', // 01:00 GMT
    '2024-10-27T02:00:00.000Z', // 02:00 GMT
  ]);
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

test('_cron.previous excludes an occurrence exactly at from', () => {
  expect(
    isoPrevious({ expression: '0 9 * * 1', from: '2024-01-08T09:00:00.000Z', timezone: 'UTC' })
  ).toEqual('2024-01-01T09:00:00.000Z');
});

test('_cron.previous returns a single date when count is one', () => {
  const result = _cron({
    methodName: 'previous',
    params: { expression: '0 9 * * 1', from, timezone: 'UTC', count: 1 },
    location,
  });
  expect(result).toBeInstanceOf(Date);
  expect(result.toISOString()).toEqual('2023-12-25T09:00:00.000Z');
});

test('_cron.previous throws when the expression never occurs', () => {
  expect(() =>
    _cron({ methodName: 'previous', params: { expression: '0 0 31 2,4 *', from }, location })
  ).toThrow(
    '_cron.previous could not evaluate the cron expression "0 0 31 2,4 *". The expression does not match any date.'
  );
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
    '_cron.previous could not evaluate the cron expression "every monday".'
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
  expect(_cron({ methodName: 'describe', params: '   ', location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: { expression: null }, location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: { expression: '' }, location })).toEqual('');
  expect(_cron({ methodName: 'describe', params: { expression: ' \t ' }, location })).toEqual('');
});

test('_cron.describe throws for expressions that _cron.validate rejects', () => {
  ['0 9 * * 1,', '0 0 9 * * 1 2024', '0 0 31 2,4 *', '0 9 LW * *', '@reboot'].forEach(
    (expression) => {
      expect(_cron({ methodName: 'validate', params: expression, location })).toBe(false);
      expect(() => _cron({ methodName: 'describe', params: expression, location })).toThrow(
        `_cron.describe could not evaluate the cron expression ${JSON.stringify(expression)}.`
      );
    }
  );
});

test('_cron.describe throws when the expression uses the H hash token', () => {
  expect(() => _cron({ methodName: 'describe', params: 'H 9 * * *', location })).toThrow(
    '_cron.describe does not support the "H" hash token, use explicit values instead. Received "H 9 * * *".'
  );
});

test('_cron.describe describes every alias _cron.validate accepts', () => {
  expect(_cron({ methodName: 'describe', params: '@daily', location })).toEqual('At 12:00 AM');
  expect(_cron({ methodName: 'describe', params: '@minutely', location })).toEqual('Every minute');
  expect(_cron({ methodName: 'describe', params: '@secondly', location })).toEqual('Every second');
  expect(_cron({ methodName: 'describe', params: '@weekdays', location })).toEqual(
    'At 12:00 AM, Monday through Friday'
  );
  expect(_cron({ methodName: 'describe', params: '@weekends', location })).toEqual(
    'At 12:00 AM, only on Sunday and Saturday'
  );
});

test('_cron.describe accepts regional locales with a hyphen or an underscore, in any case', () => {
  const expected = 'Às 09:00, somente de segunda-feira';
  ['pt_BR', 'pt-BR', 'pt-br', 'PT_BR'].forEach((locale) => {
    expect(
      _cron({ methodName: 'describe', params: { expression: '0 9 * * 1', locale }, location })
    ).toEqual(expected);
  });
});

test('_cron.describe throws for an unsupported locale', () => {
  expect(() =>
    _cron({ methodName: 'describe', params: { expression: '0 9 * * 1', locale: 'xx' }, location })
  ).toThrow('_cron.describe does not support the locale "xx". Use one of: af, ar,');
  expect(() =>
    _cron({ methodName: 'describe', params: { expression: '0 9 * * 1', locale: 'pt' }, location })
  ).toThrow('_cron.describe does not support the locale "pt".');
});

test('_cron.describe throws when the locale is not a string', () => {
  expect(() =>
    _cron({ methodName: 'describe', params: { expression: '0 9 * * 1', locale: 1 }, location })
  ).toThrow('_cron.describe "locale" must be a string. Received 1.');
});

test('the cronstrue locale list matches the locales installed with cronstrue', () => {
  const require = createRequire(import.meta.url);
  const localesDir = path.join(path.dirname(require.resolve('cronstrue/package.json')), 'locales');
  const installed = fs
    .readdirSync(localesDir)
    .filter((file) => file.endsWith('.js') && !file.endsWith('.min.js'))
    .map((file) => file.replace(/\.js$/, ''))
    .sort();
  expect([...cronstrueLocales].sort()).toEqual(installed);
});

test('_cron.describe throws when the expression cannot be parsed', () => {
  expect(() => _cron({ methodName: 'describe', params: 'every monday', location })).toThrow(
    '_cron.describe could not evaluate the cron expression "every monday".'
  );
});

test('_cron.describe throws when the expression is not a string', () => {
  expect(() => _cron({ methodName: 'describe', params: { expression: 9 }, location })).toThrow(
    '_cron.describe requires a non-empty cron expression string. Received 9.'
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
  expect(_cron({ methodName: 'validate', params: {}, location })).toBe(false);
});

test('_cron.validate returns false when the expression is blank', () => {
  expect(_cron({ methodName: 'validate', params: '', location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: '   ', location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: { expression: '' }, location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: { expression: '   ' }, location })).toBe(false);
});

test('_cron.validate returns false for any input that is not a string', () => {
  [9, true, false, ['0 9 * * 1'], new Date()].forEach((params) => {
    expect(_cron({ methodName: 'validate', params, location })).toBe(false);
  });
  [9, true, ['0 9 * * 1'], { value: '0 9 * * 1' }].forEach((expression) => {
    expect(_cron({ methodName: 'validate', params: { expression }, location })).toBe(false);
  });
});

test('_cron.validate returns false when the expression uses the H hash token', () => {
  expect(_cron({ methodName: 'validate', params: 'H 9 * * *', location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: '0 H(0-5) * * *', location })).toBe(false);
});

test('_cron.validate returns false when the expression never occurs', () => {
  expect(_cron({ methodName: 'validate', params: '0 0 31 2,4 *', location })).toBe(false);
  expect(_cron({ methodName: 'validate', params: '0 0 30 2 *', location })).toBe(false);
});

test('_cron.validate accepts aliases, seconds, L, # and ?', () => {
  [
    '@yearly',
    '@annually',
    '@monthly',
    '@weekly',
    '@daily',
    '@hourly',
    '@minutely',
    '@secondly',
    '@weekdays',
    '@weekends',
    '0 0 9 * * 1',
    '0 9 L * *',
    '0 9 * * 5L',
    '0 9 * * 1#2',
    '0 9 ? * 1',
    '0 9 * JAN MON',
    '0 0 29 2 *',
  ].forEach((expression) => {
    expect(_cron({ methodName: 'validate', params: expression, location })).toBe(true);
  });
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
    '_cron.fields could not evaluate the cron expression "every monday".'
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
