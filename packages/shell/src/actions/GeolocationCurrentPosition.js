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
import { getDeviceFeature, hasDeviceFeature } from '@lowdefy/blocks-native/device';

import injected from '../device/injected.js';

function numberOrNull(value) {
  return type.isNumber(value) ? value : null;
}

/**
 * The native body of actions-core's GeolocationCurrentPosition, answering as the web body does:
 * `{ coords, timestamp }`, or `{ code: 1, error: 'PERMISSION_DENIED', message }` when location is
 * refused. A location Lowdefy Dev injected (src/device/injected.js) answers first; otherwise the
 * shell's location feature reads the phone (profile field and up), and a shell without it throws.
 */
async function GeolocationCurrentPosition({ params }) {
  if (injected('permission:location') === 'denied') {
    return { code: 1, error: 'PERMISSION_DENIED', message: 'Location permission was denied.' };
  }
  const location = injected('location');
  if (type.isUndefined(location)) {
    if (!hasDeviceFeature('location')) {
      throw new Error(
        'GeolocationCurrentPosition needs a shell that carries location (profile field). In Lowdefy Dev, inject a location.'
      );
    }
    return getDeviceFeature({ feature: 'location', action: 'GeolocationCurrentPosition' }).current(
      params ?? {}
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
