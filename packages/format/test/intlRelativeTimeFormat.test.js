/*
  Copyright 2020 Lowdefy, Inc

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

import intlRelativeTimeFormat from '../src/intlRelativeTimeFormat';

test('only unit specified', () => {
  expect(intlRelativeTimeFormat({ unit: 'days' })(4)).toEqual('in 4 days');
  expect(intlRelativeTimeFormat({ unit: 'days' })(-4)).toEqual('4 days ago');
});

test('locales', () => {
  expect(intlRelativeTimeFormat({ unit: 'days', locale: 'fr' })(4)).toEqual('dans 4 jours');
});

test('options', () => {
  expect(intlRelativeTimeFormat({ unit: 'days', options: { numeric: 'auto' } })(1)).toEqual(
    'tomorrow'
  );
});
