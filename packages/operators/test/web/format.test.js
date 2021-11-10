/*
  Copyright 2020-2021 Lowdefy, Inc

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

import formatters from '@lowdefy/format';

import format from '../../src/web/format.js';

const location = 'location';
const params = { params: { formatParams: true }, on: 'on' };

console.error = () => {};

jest.mock('@lowdefy/format', () => ({
  intlDateTimeFormat: jest.fn(() => () => 'intlDateTimeFormat'),
  intlListFormat: jest.fn(() => () => 'intlListFormat'),
  intlNumberFormat: jest.fn(() => () => 'intlNumberFormat'),
  intlRelativeTimeFormat: jest.fn(() => () => 'intlRelativeTimeFormat'),
  momentFormat: jest.fn(() => () => 'momentFormat'),
  momentHumanizeDuration: jest.fn(() => () => 'momentHumanizeDuration'),
}));

test('_format calls intlDateTimeFormat', () => {
  const res = format({ location, methodName: 'intlDateTimeFormat', params });
  expect(res).toEqual('intlDateTimeFormat');
  expect(formatters.intlDateTimeFormat.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format calls intlDateTimeFormat, formatter params undefined', () => {
  const res = format({ location, methodName: 'intlDateTimeFormat', params: { on: 'on' } });
  expect(res).toEqual('intlDateTimeFormat');
  expect(formatters.intlDateTimeFormat.mock.calls).toEqual([[undefined]]);
});

test('_format calls intlListFormat', () => {
  const res = format({ location, methodName: 'intlListFormat', params });
  expect(res).toEqual('intlListFormat');
  expect(formatters.intlListFormat.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format calls intlNumberFormat', () => {
  const res = format({ location, methodName: 'intlNumberFormat', params });
  expect(res).toEqual('intlNumberFormat');
  expect(formatters.intlNumberFormat.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format calls intlRelativeTimeFormat', () => {
  const res = format({ location, methodName: 'intlRelativeTimeFormat', params });
  expect(res).toEqual('intlRelativeTimeFormat');
  expect(formatters.intlRelativeTimeFormat.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format calls momentFormat', () => {
  const res = format({ location, methodName: 'momentFormat', params });
  expect(res).toEqual('momentFormat');
  expect(formatters.momentFormat.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format calls momentHumanizeDuration', () => {
  const res = format({ location, methodName: 'momentHumanizeDuration', params });
  expect(res).toEqual('momentHumanizeDuration');
  expect(formatters.momentHumanizeDuration.mock.calls).toEqual([
    [
      {
        formatParams: true,
      },
    ],
  ]);
});

test('_format not a object', () => {
  expect(() =>
    format({ location, methodName: 'momentHumanizeDuration', params: 10 })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _format takes an object as arguments. Received: 10 at location."`
  );
});

test('_format formatter params not a object or undefined', () => {
  expect(() =>
    format({ location, methodName: 'momentHumanizeDuration', params: { params: 10, on: 'on' } })
  ).toThrowErrorMatchingInlineSnapshot(
    `"Operator Error: _format params argument should be an object or undefined. Received: {\\"params\\":10,\\"on\\":\\"on\\"} at location."`
  );
});

test('_format invalid formatter name', () => {
  expect(() => format({ location, methodName: 'invalid', params }))
    .toThrowErrorMatchingInlineSnapshot(`
    "Operator Error: $_format.invalid is not supported, use one of the following: intlDateTimeFormat, intlListFormat, intlNumberFormat, intlRelativeTimeFormat, momentFormat, momentHumanizeDuration.
          Received: {\\"_format.invalid\\":{\\"params\\":{\\"formatParams\\":true},\\"on\\":\\"on\\"}} at location."
  `);
});
