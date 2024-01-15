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

import _moment from './moment.js';

describe('_moment.format', () => {
  const methodName = 'format';

  test('No options', () => {
    expect(
      _moment({
        params: {
          on: new Date(1560414023345),
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('2019-06-13T08:20:23+00:00');
  });

  test('locales', () => {
    expect(
      _moment({
        params: {
          on: new Date(1560414023345),
          locale: 'ar-EG',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('٢٠١٩-٠٦-١٣T٠٨:٢٠:٢٣+٠٠:٠٠');
  });

  test('specify format', () => {
    expect(
      _moment({
        params: {
          on: new Date(1560414023345),
          format: 'd MMM YYYY',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('4 Jun 2019');
  });
});

describe('_moment.humanizeDuration', () => {
  const methodName = 'humanizeDuration';

  test('No options', () => {
    expect(
      _moment({
        params: {
          on: 245923000,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('3 days');
  });

  test('locales', () => {
    expect(
      _moment({
        params: {
          on: 245923000,
          locale: 'ar-EG',
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('٣ أيام');
  });

  test('withSuffix', () => {
    expect(
      _moment({
        params: {
          on: 245923000,
          withSuffix: true,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('in 3 days');
    expect(
      _moment({
        params: {
          on: -245923000,
          withSuffix: true,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('3 days ago');
  });

  test('thresholds', () => {
    expect(
      _moment({
        params: {
          on: 604800000,
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('7 days');
    expect(
      _moment({
        params: {
          on: 604800000,
          thresholds: { d: 7, w: 4 },
        },
        location: 'locationId',
        methodName,
      })
    ).toEqual('a week');
  });
});
