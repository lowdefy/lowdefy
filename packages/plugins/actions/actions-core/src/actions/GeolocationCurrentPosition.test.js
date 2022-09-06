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

import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';
import GeolocationCurrentPosition from './GeolocationCurrentPosition.js';

const mockGetCurrentPosition = jest.fn();

const getCurrentPositionSuccessImp = async (success, error, options) => {
  await wait(10);
  success({
    coords: {
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: 90,
      latitude: -30.5595,
      longitude: 22.9375,
      speed: null,
    },
    timestamp: 123,
  });
};

const getCurrentPositionErrorImp = async (success, error) => {
  await wait(10);
  error(new Error('Test error.'));
};

const globals = {
  window: {
    navigator: {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    },
  },
};

const params = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

test('GeolocationCurrentPosition get successful geolocation', async () => {
  mockGetCurrentPosition.mockImplementationOnce(getCurrentPositionSuccessImp);

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual({
    coords: {
      accuracy: 1,
      altitude: null,
      altitudeAccuracy: null,
      heading: 90,
      latitude: -30.5595,
      longitude: 22.9375,
      speed: null,
    },
    timestamp: 123,
  });
  expect(mockGetCurrentPosition.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        [Function],
        [Function],
        Object {
          "enableHighAccuracy": true,
          "maximumAge": 0,
          "timeout": 5000,
        },
      ],
    ]
  `);
});

test('GeolocationCurrentPosition no geolocation on window.navigator', async () => {
  const globals = {
    window: {
      navigator: {},
    },
  };

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual(null);
});

test('GeolocationCurrentPosition fail to get geolocation', async () => {
  mockGetCurrentPosition.mockImplementationOnce(getCurrentPositionErrorImp);

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual(null);
  expect(mockGetCurrentPosition.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        [Function],
        [Function],
        Object {
          "enableHighAccuracy": true,
          "maximumAge": 0,
          "timeout": 5000,
        },
      ],
    ]
  `);
});
