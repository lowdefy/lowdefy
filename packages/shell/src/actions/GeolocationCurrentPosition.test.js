/*
  Copyright 2020-2026 Lowdefy, Inc

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
import { installDevice } from '@lowdefy/blocks-native/device';

import createDeviceInjections from '../dev/inject/createDeviceInjections.js';
import createFakeNetwork from '../test/createFakeNetwork.js';
import createNetworkStatus from '../host/createNetworkStatus.js';
import GeolocationCurrentPosition from './GeolocationCurrentPosition.js';
import { installInjector } from '../device/injected.js';

let injections;
let remove;
beforeEach(() => {
  injections = createDeviceInjections({
    networkStatus: createNetworkStatus({ network: createFakeNetwork() }),
  });
  remove = installInjector(injections);
});
afterEach(() => remove());

test('GeolocationCurrentPosition answers with the injected location in the web shape', async () => {
  injections.inject({
    kind: 'location',
    value: { latitude: -33.92, longitude: 18.42, accuracy: 12, timestamp: 1760778000000 },
  });
  await expect(GeolocationCurrentPosition({ params: {} })).resolves.toEqual({
    coords: {
      accuracy: 12,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      latitude: -33.92,
      longitude: 18.42,
      speed: null,
    },
    timestamp: 1760778000000,
  });
});

test('GeolocationCurrentPosition answers as the web does when location is refused', async () => {
  injections.inject({ kind: 'location', value: { latitude: -33.92, longitude: 18.42 } });
  injections.inject({ kind: 'permission', name: 'location', value: 'denied' });
  await expect(GeolocationCurrentPosition({ params: {} })).resolves.toEqual({
    code: 1,
    error: 'PERMISSION_DENIED',
    message: 'Location permission was denied.',
  });
});

test('GeolocationCurrentPosition throws when the shell carries no location and none was injected', async () => {
  await expect(GeolocationCurrentPosition({ params: {} })).rejects.toThrow(
    'GeolocationCurrentPosition needs a shell that carries location (profile field). In Lowdefy Dev, inject a location.'
  );
});

test('GeolocationCurrentPosition reads the location feature when nothing was injected', async () => {
  const current = jest.fn(async () => ({ coords: { latitude: 1, longitude: 2 }, timestamp: 5 }));
  const removeDevice = installDevice({ location: { current } });
  await expect(
    GeolocationCurrentPosition({ params: { enableHighAccuracy: true } })
  ).resolves.toEqual({ coords: { latitude: 1, longitude: 2 }, timestamp: 5 });
  expect(current).toHaveBeenCalledWith({ enableHighAccuracy: true });
  removeDevice();
});
