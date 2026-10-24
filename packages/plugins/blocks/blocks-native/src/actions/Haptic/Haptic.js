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

import getDeviceFeature from '../../device/getDeviceFeature.js';

const HAPTIC_TYPES = ['selection', 'light', 'medium', 'heavy', 'success', 'warning', 'error'];

// Plays one haptic: a selection tick, an impact (light, medium, heavy) or a notification
// (success, warning, error). expo-haptics, every shell.
async function Haptic({ params }) {
  const hapticType = params?.type ?? 'light';
  if (!HAPTIC_TYPES.includes(hapticType)) {
    throw new Error(
      `Haptic "type" should be one of ${HAPTIC_TYPES.join(', ')}. Received ${JSON.stringify(
        hapticType
      )}.`
    );
  }
  await getDeviceFeature({ feature: 'haptics', action: 'Haptic' })(hapticType);
}

export { HAPTIC_TYPES };
export default Haptic;
