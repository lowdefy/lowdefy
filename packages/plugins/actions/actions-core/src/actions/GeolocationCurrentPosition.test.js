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

import { jest } from '@jest/globals';
import { wait } from '@lowdefy/helpers';
import GeolocationCurrentPosition from './GeolocationCurrentPosition.js';

const mockGetCurrentPosition = jest.fn();

class GeolocationPositionError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

const getCurrentPositionSuccessImp = async (success, error, options) => {
  await wait(10);
  success({
    coords: {
      accuracy: 1,
      altitude: 2,
      altitudeAccuracy: 45,
      heading: 90,
      latitude: -30.5595,
      longitude: 22.9375,
      speed: 100,
    },
    timestamp: 123,
  });
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
      altitude: 2,
      altitudeAccuracy: 45,
      heading: 90,
      latitude: -30.5595,
      longitude: 22.9375,
      speed: 100,
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

  await expect(GeolocationCurrentPosition({ globals, params })).rejects.toThrow(
    'Cannot read properties of undefined'
  );
});

test('GeolocationCurrentPosition fail to get geolocation', async () => {
  const permissionDeniedErrorImp = async (success, error) => {
    await wait(10);
    error(new GeolocationPositionError('Permission denied.', 1));
  };
  mockGetCurrentPosition.mockImplementationOnce(permissionDeniedErrorImp);

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual({
    code: 1,
    error: 'PERMISSION_DENIED',
    message: 'Permission denied.',
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

test('GeolocationCurrentPosition fail to get geolocation', async () => {
  const permissionDeniedErrorImp = async (success, error) => {
    await wait(10);
    error(new GeolocationPositionError('Position unavailable.', 2));
  };
  mockGetCurrentPosition.mockImplementationOnce(permissionDeniedErrorImp);

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual({
    code: 2,
    error: 'POSITION_UNAVAILABLE',
    message: 'Position unavailable.',
  });
});

test('GeolocationCurrentPosition fail to get geolocation', async () => {
  const permissionDeniedErrorImp = async (success, error) => {
    await wait(10);
    error(new GeolocationPositionError('Get position timeout.', 3));
  };
  mockGetCurrentPosition.mockImplementationOnce(permissionDeniedErrorImp);

  const res = await GeolocationCurrentPosition({ globals, params });

  expect(res).toEqual({
    code: 3,
    error: 'TIMEOUT',
    message: 'Get position timeout.',
  });
});
