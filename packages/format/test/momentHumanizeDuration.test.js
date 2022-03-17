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

import momentHumanizeDuration from '../src/momentHumanizeDuration';

test('no options', () => {
  expect(momentHumanizeDuration()(245923000)).toEqual('3 days');
  expect(momentHumanizeDuration({})(245923000)).toEqual('3 days');
});

test('locales', () => {
  expect(momentHumanizeDuration({ locale: 'ar-EG' })(245923000)).toEqual('٣ أيام');
});

test('withSuffix', () => {
  expect(
    momentHumanizeDuration({
      withSuffix: true,
    })(245923000)
  ).toEqual('in 3 days');
  expect(
    momentHumanizeDuration({
      withSuffix: true,
    })(-245923000)
  ).toEqual('3 days ago');
});

test('thresholds', () => {
  expect(momentHumanizeDuration({})(604800000)).toEqual('7 days');
  expect(
    momentHumanizeDuration({
      thresholds: { d: 7, w: 4 },
    })(604800000)
  ).toEqual('a week');
});
