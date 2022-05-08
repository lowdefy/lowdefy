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

import intlListFormat from '../src/intlListFormat';

test('no options', () => {
  expect(intlListFormat()(['Motorcycle', 'Bus', 'Car'])).toEqual('Motorcycle, Bus, and Car');
});

test('locales', () => {
  expect(intlListFormat({ locale: 'fr' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle, Bus et Car'
  );
  expect(intlListFormat({ locale: 'de' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle, Bus und Car'
  );
  expect(intlListFormat({ locale: 'ja' })(['Motorcycle', 'Bus', 'Car'])).toEqual(
    'Motorcycle、Bus、Car'
  );
});

test('options', () => {
  expect(
    intlListFormat({
      locale: 'en',
      options: { style: 'long', type: 'conjunction' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle, Bus, and Car');
  expect(
    intlListFormat({
      locale: 'de',
      options: { style: 'short', type: 'disjunction' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle, Bus oder Car');
  expect(
    intlListFormat({
      locale: 'en',
      options: { style: 'narrow', type: 'unit' },
    })(['Motorcycle', 'Bus', 'Car'])
  ).toEqual('Motorcycle Bus Car');
});
