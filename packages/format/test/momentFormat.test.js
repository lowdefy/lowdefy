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

import momentFormat from '../src/momentFormat';

// FIXME: Fails if run in a different timezone/locale
test('no options', () => {
  expect(momentFormat()(new Date(1560414023345))).toEqual('2019-06-13T10:20:23+02:00');
  expect(momentFormat({})(new Date(1560414023345))).toEqual('2019-06-13T10:20:23+02:00');
});

test('locales', () => {
  expect(momentFormat({ locale: 'ar-EG' })(new Date(1560414023345))).toEqual(
    '٢٠١٩-٠٦-١٣T١٠:٢٠:٢٣+٠٢:٠٠'
  );
});

test('specify format', () => {
  expect(
    momentFormat({
      format: 'd MMM YYYY',
    })(new Date(1560414023345))
  ).toEqual('4 Jun 2019');
});
