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

import moment from 'moment';
import disabledDate from './disabledDate.js';

test('default', () => {
  const fn = disabledDate();
  expect(fn(moment(new Date(0)))).toEqual(false);
});

test('disabledDate.min', () => {
  const fn = disabledDate({
    min: new Date('2020-01-01T00:00:00.000Z'),
  });
  expect(fn(moment('2019-12-31T23:59:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T01:00:00.000Z'))).toEqual(false);
});

test('disabledDate.min invalid', () => {
  const fn = disabledDate({
    min: 0,
  });
  expect(fn(moment('2019-12-31T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T01:00:00.000Z'))).toEqual(false);
});

test('disabledDate.max', () => {
  const fn = disabledDate({
    max: new Date('2020-01-01T00:00:00.000Z'),
  });
  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-02T00:00:00.000Z'))).toEqual(true);
});

test('disabledDate.max invalid', () => {
  const fn = disabledDate({
    max: 'x',
  });
  expect(fn(moment('2019-12-31T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T01:00:00.000Z'))).toEqual(false);
});

test('disabledDate.dates', () => {
  const fn = disabledDate({
    dates: [new Date('2020-01-01T00:00:00.000Z'), new Date('2020-01-05T00:00:00.000Z')],
  });

  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-01T01:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-05T00:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-05T12:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-06T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-04T23:59:00.000Z'))).toEqual(false);
});

test('disabledDate.dates - invalid: schema to throw', () => {
  const fn = disabledDate({
    dates: ['x', new Date('2020-01-05T00:00:00.000Z')],
  });

  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T01:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-05T00:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-05T12:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-06T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-04T23:59:00.000Z'))).toEqual(false);
});

test('disabledDate.range', () => {
  const fn = disabledDate({
    ranges: [[new Date('2020-01-02T00:00:00.000Z'), new Date('2020-01-05T00:00:00.000Z')]],
  });

  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-02T00:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-04T23:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-05T00:00:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-05T23:59:00.000Z'))).toEqual(true);
  expect(fn(moment('2020-01-06T00:00:00.000Z'))).toEqual(false);
});

test('disabledDate.range - invalid: schema to throw', () => {
  const fn = disabledDate({
    ranges: [new Date('2020-01-02T00:00:00.000Z'), new Date('2020-01-05T00:00:00.000Z')],
  });

  expect(fn(moment('2020-01-01T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-01T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-02T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-04T23:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-05T00:00:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-05T23:59:00.000Z'))).toEqual(false);
  expect(fn(moment('2020-01-06T00:00:00.000Z'))).toEqual(false);
});
