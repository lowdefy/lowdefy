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

import intlDateTimeFormat from '../src/intlDateTimeFormat';

test('no options', () => {
  const formatter = intlDateTimeFormat();
  expect(formatter(new Date(1560414023345))).toEqual('6/13/2019');
});

test('locales', () => {
  expect(intlDateTimeFormat({ locale: 'ar-EG' })(new Date(1560414023345))).toEqual('١٣‏/٦‏/٢٠١٩');
  expect(intlDateTimeFormat({ locale: 'ja-JP-u-ca-japanese' })(new Date(1560414023345))).toEqual(
    'R1/6/13'
  );
});

test('options', () => {
  expect(
    intlDateTimeFormat({
      locale: 'en',
      options: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    })(new Date(1560414023345))
  ).toEqual('Thursday, June 13, 2019');
  expect(
    intlDateTimeFormat({
      locale: 'en',
      options: {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZone: 'Australia/Sydney',
        timeZoneName: 'short',
      },
    })(new Date(1560414023345))
  ).toEqual('6:20:23 PM GMT+10');
});
