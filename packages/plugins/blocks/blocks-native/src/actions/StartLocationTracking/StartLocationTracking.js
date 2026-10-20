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

import getDeviceFeature from '../../device/getDeviceFeature.js';

// Tracks the phone in the background, posting batches of points to an API endpoint as { locations:
// [{ latitude, longitude, accuracy, speed, heading, altitude, timestamp }] }. The phone shows its
// location indicator while it runs. Shells with background location (profile field-tracking).
async function StartLocationTracking({ params }) {
  if (type.isNone(params?.endpointId)) {
    throw new Error(
      `StartLocationTracking requires "endpointId". Received ${JSON.stringify(params)}.`
    );
  }
  return getDeviceFeature({ feature: 'tracking', action: 'StartLocationTracking' }).startTracking(
    params ?? {}
  );
}

export default StartLocationTracking;
