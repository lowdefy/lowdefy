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

// Watches regions in the background. Entering or leaving one posts { event: enter | exit, region }
// to the endpoint and fires onGeofence when the app is open. iOS watches at most 20 regions.
// Replaces the regions watched before. Shells with background location (profile field-tracking).
async function StartGeofencing({ params }) {
  if (type.isNone(params?.regions)) {
    throw new Error(`StartGeofencing requires "regions". Received ${JSON.stringify(params)}.`);
  }
  return getDeviceFeature({ feature: 'tracking', action: 'StartGeofencing' }).startGeofencing(
    params ?? {}
  );
}

export default StartGeofencing;
