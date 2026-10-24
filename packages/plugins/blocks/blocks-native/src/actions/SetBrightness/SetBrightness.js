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

// Sets the app's screen brightness, 0 to 1, for a scan screen; reset gives it back to the system.
// Undone when the app goes to the background. Shells with the camera (profile field).
async function SetBrightness({ params }) {
  return getDeviceFeature({ feature: 'brightness', action: 'SetBrightness' }).set(params ?? {});
}

export default SetBrightness;
