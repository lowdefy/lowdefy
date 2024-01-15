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

import _date from './date.js';

const location = 'location';

test('_date now', () => {
  const RealDate = Date;
  const constantDate = new Date();
  global.Date = class extends Date {
    constructor() {
      super();
      return constantDate;
    }
  };
  expect(_date({ params: 'now', location })).toEqual(constantDate);
  expect(_date({ params: null, location, methodName: 'now' })).toEqual(constantDate);
  global.Date = RealDate;
});

test('_date from string', () => {
  expect(_date({ params: '2018-01-01T12:00:00.000Z', location })).toEqual(
    new Date('2018-01-01T12:00:00.000Z')
  );
});

test('_date short format', () => {
  expect(_date({ params: '2018-01-01', location })).toEqual(new Date('2018-01-01'));
});

test('_date from unix timestamp', () => {
  expect(_date({ params: 1569579992, location })).toEqual(new Date(1569579992));
});

test('_date float', () => {
  expect(_date({ params: 1.3, location })).toEqual(new Date(1.3));
});

test('_date negative int', () => {
  expect(_date({ params: -1000, location })).toEqual(new Date(-1000));
});

test('_date null', () => {
  expect(() => _date({ params: null, location })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _date.__default accepts one of the following types: number, string.
          Received: {\\"_date.__default\\":null} at location."
  `);
});

test('_date invalid operator type', () => {
  expect(() => _date({ params: {}, location })).toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: _date.__default accepts one of the following types: number, string.
          Received: {\\"_date.__default\\":{}} at location."
  `);
});

test('_date invalid string', () => {
  expect(() => _date({ params: 'abc', location })).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _date.__default - abc could not resolve as a valid javascript date. Received: {\\"_date.__default\\":\\"abc\\"} at location."`
  );
});

test('_date getDate', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getDate' })
  ).toEqual(21);
});

test('_date getDay', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getDay' })
  ).toEqual(3);
});

test('_date getFullYear', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getFullYear' })
  ).toEqual(2022);
});

test('_date getHours', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getHours' })
  ).toEqual(8);
});

test('_date getMilliseconds', () => {
  expect(
    _date({
      params: new Date('2022-12-21T10:17:03.100+02:00'),
      methodName: 'getMilliseconds',
    })
  ).toEqual(100);
});

test('_date getMinutes', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getMinutes' })
  ).toEqual(17);
});

test('_date getMonth', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getMonth' })
  ).toEqual(11);
});

test('_date getSeconds', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getSeconds' })
  ).toEqual(3);
});

test('_date getTime', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getTime' })
  ).toEqual(1671610623100);
});

test('_date getTimezoneOffset', () => {
  expect(
    _date({
      params: new Date('2022-12-21T10:17:03.100+02:00'),
      methodName: 'getTimezoneOffset',
    })
  ).toEqual(0);
});

test('_date getUTCDate', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCDate' })
  ).toEqual(21);
});

test('_date getUTCDay', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCDay' })
  ).toEqual(3);
});

test('_date getUTCFullYear', () => {
  expect(
    _date({
      params: new Date('2022-12-21T10:17:03.100+02:00'),
      methodName: 'getUTCFullYear',
    })
  ).toEqual(2022);
});

test('_date getUTCHours', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCHours' })
  ).toEqual(8);
});

test('_date getUTCMilliseconds', () => {
  expect(
    _date({
      params: new Date('2022-12-21T10:17:03.100+02:00'),
      methodName: 'getUTCMilliseconds',
    })
  ).toEqual(100);
});

test('_date getUTCMinutes', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCMinutes' })
  ).toEqual(17);
});

test('_date getUTCMonth', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCMonth' })
  ).toEqual(11);
});

test('_date getUTCSeconds', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'getUTCSeconds' })
  ).toEqual(3);
});

test('_date parse', () => {
  expect(_date({ params: '2022-12-21T10:17:03.100+02:00', methodName: 'parse' })).toEqual(
    1671610623100
  );
});

test('_date setDate', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), dayOfMonth: 22 },
      methodName: 'setDate',
    })
  ).toEqual(1671697023100);
});

test('_date setFullYear', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), year: 2023 },
      methodName: 'setFullYear',
    })
  ).toEqual(1703146623100);
});

test('_date setHours', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), hours: 11 },
      methodName: 'setHours',
    })
  ).toEqual(1671621423100);
});

test('_date setMilliseconds', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), milliseconds: 1 },
      methodName: 'setMilliseconds',
    })
  ).toEqual(1671610623001);
});

test('_date setMinutes', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), minutes: 18 },
      methodName: 'setMinutes',
    })
  ).toEqual(1671610683100);
});

test('_date setMonth', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), month: 1 },
      methodName: 'setMonth',
    })
  ).toEqual(1645431423100);
});

test('_date setSeconds', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), seconds: 4 },
      methodName: 'setSeconds',
    })
  ).toEqual(1671610624100);
});

test('_date setTime', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), time: 1671610000000 },
      methodName: 'setTime',
    })
  ).toEqual(1671610000000);
});

test('_date setUTCDate', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), dayOfMonth: 22 },
      methodName: 'setUTCDate',
    })
  ).toEqual(1671697023100);
});

test('_date setUTCFullYear', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), year: 2023 },
      methodName: 'setUTCFullYear',
    })
  ).toEqual(1703146623100);
});

test('_date setUTCHours', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), hours: 11 },
      methodName: 'setUTCHours',
    })
  ).toEqual(1671621423100);
});

test('_date setUTCMilliseconds', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), milliseconds: 1 },
      methodName: 'setUTCMilliseconds',
    })
  ).toEqual(1671610623001);
});

test('_date setUTCMinutes', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), minutes: 18 },
      methodName: 'setUTCMinutes',
    })
  ).toEqual(1671610683100);
});

test('_date setUTCMonth', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), month: 1 },
      methodName: 'setUTCMonth',
    })
  ).toEqual(1645431423100);
});

test('_date setUTCSeconds', () => {
  expect(
    _date({
      params: { on: new Date('2022-12-21T10:17:03.100+02:00'), seconds: 4 },
      methodName: 'setUTCSeconds',
    })
  ).toEqual(1671610624100);
});

test('_date toDateString', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'toDateString' })
  ).toEqual('Wed Dec 21 2022');
});

test('_date toISOString', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'toISOString' })
  ).toEqual('2022-12-21T08:17:03.100Z');
});

test('_date toJSON', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'toJSON' })
  ).toEqual('2022-12-21T08:17:03.100Z');
});

test('_date toTimeString', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'toTimeString' })
  ).toEqual('08:17:03 GMT+0000 (Coordinated Universal Time)');
});

test('_date toUTCString', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'toUTCString' })
  ).toEqual('Wed, 21 Dec 2022 08:17:03 GMT');
});

test('_date UTC', () => {
  expect(
    _date({
      params: { year: 2022, month: 11, day: 21, hours: 10, minutes: 17, seconds: 3 },
      methodName: 'UTC',
    })
  ).toEqual(1671617823000);
});

test('_date valueOf', () => {
  expect(
    _date({ params: new Date('2022-12-21T10:17:03.100+02:00'), methodName: 'valueOf' })
  ).toEqual(1671610623100);
});
