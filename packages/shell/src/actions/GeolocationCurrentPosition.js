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

import { type } from '@lowdefy/helpers';

import injected from '../device/injected.js';

function numberOrNull(value) {
  return type.isNumber(value) ? value : null;
}

/**
 * The native body of actions-core's GeolocationCurrentPosition, answering as the web body does:
 * `{ coords, timestamp }`, or `{ code: 1, error: 'PERMISSION_DENIED', message }` when location is
 * refused. Until the shell carries device location (the device actions), it answers only with a
 * location Lowdefy Dev injected (src/device/injected.js), and throws otherwise.
 */
async function GeolocationCurrentPosition() {
  if (injected('permission:location') === 'denied') {
    return { code: 1, error: 'PERMISSION_DENIED', message: 'Location permission was denied.' };
  }
  const location = injected('location');
  if (type.isUndefined(location)) {
    throw new Error(
      'GeolocationCurrentPosition is not available on this phone yet: the shell has no device location. In Lowdefy Dev, inject a location.'
    );
  }
  return {
    coords: {
      accuracy: numberOrNull(location.accuracy),
      altitude: numberOrNull(location.altitude),
      altitudeAccuracy: numberOrNull(location.altitudeAccuracy),
      heading: numberOrNull(location.heading),
      latitude: location.latitude,
      longitude: location.longitude,
      speed: numberOrNull(location.speed),
    },
    timestamp: location.timestamp ?? Date.now(),
  };
}

export default GeolocationCurrentPosition;
