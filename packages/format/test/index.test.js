/*
  Copyright 2020-2022 Lowdefy, Inc

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

import formatters, {
  intlDateTimeFormat,
  intlListFormat,
  intlNumberFormat,
  intlRelativeTimeFormat,
  momentFormat,
  momentHumanizeDuration,
} from '../src/index';

// test('default formatter', () => {
//   const formatter = getFormatter();
//   expect(formatter('string')).toEqual('string');
// });

// test('Invalid formatter name', () => {
//   expect(() => {
//     getFormatter('invalid', {});
//   }).toThrow('Invalid Formatter: "invalid" does not exist');
// });

test('intlDateTimeFormat', () => {
  let formatter = formatters.intlDateTimeFormat({
    locale: 'de',
    options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  });
  expect(formatter(new Date(1560414023345))).toEqual('Donnerstag, 13. Juni 2019');
  formatter = intlDateTimeFormat({
    locale: 'de',
    options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
  });
  expect(formatter(new Date(1560414023345))).toEqual('Donnerstag, 13. Juni 2019');
});

test('intlListFormat', () => {
  let formatter = formatters.intlListFormat({
    locale: 'de',
    options: { style: 'short', type: 'disjunction' },
  });
  expect(formatter(['Motorcycle', 'Bus', 'Car'])).toEqual('Motorcycle, Bus oder Car');
  formatter = intlListFormat({
    locale: 'de',
    options: { style: 'short', type: 'disjunction' },
  });
  expect(formatter(['Motorcycle', 'Bus', 'Car'])).toEqual('Motorcycle, Bus oder Car');
});

test('intlNumberFormat', () => {
  let formatter = formatters.intlNumberFormat({
    locale: 'de',
    options: { style: 'currency', currency: 'EUR' },
  });
  expect(formatter(12364374.6)).toEqual('12.364.374,60 €');
  formatter = intlNumberFormat({
    locale: 'de',
    options: { style: 'currency', currency: 'EUR' },
  });
  expect(formatter(12364374.6)).toEqual('12.364.374,60 €');
});

test('intlRelativeTimeFormat', () => {
  let formatter = formatters.intlRelativeTimeFormat({
    locale: 'de',
    unit: 'days',
    options: { numeric: 'auto' },
  });
  expect(formatter(1)).toEqual('morgen');
  formatter = intlRelativeTimeFormat({
    locale: 'de',
    unit: 'days',
    options: { numeric: 'auto' },
  });
  expect(formatter(1)).toEqual('morgen');
});

test('momentFormat', () => {
  let formatter = formatters.momentFormat({
    locale: 'de',
    format: 'd MMM YYYY',
  });
  expect(formatter(new Date(1560414023345))).toEqual('4 Juni 2019');
  formatter = momentFormat({
    locale: 'de',
    format: 'd MMM YYYY',
  });
  expect(formatter(new Date(1560414023345))).toEqual('4 Juni 2019');
});

test('momentHumanizeDuration', () => {
  let formatter = formatters.momentHumanizeDuration({
    locale: 'fr',
    withSuffix: true,
    thresholds: { d: 7, w: 4 },
  });
  expect(formatter(604800000)).toEqual('dans une semaine');
  formatter = formatters.momentHumanizeDuration({
    locale: 'fr',
    withSuffix: true,
    thresholds: { d: 7, w: 4 },
  });
  expect(formatter(604800000)).toEqual('dans une semaine');
});
