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

import { hasDeviceFeature } from './getDeviceFeature.js';
import getDeviceFeature from './getDeviceFeature.js';

/**
 * The light haptic a native control plays when it changes (a toggle, a pick, a full swipe). Every
 * shell carries haptics; under Jest, or where the shell installed none, the control is silent.
 * Never awaited: feedback must not hold up the change.
 *
 * @param {'selection'|'light'|'medium'|'heavy'|'success'|'warning'|'error'} type
 */
function playFeedback(type = 'selection') {
  if (!hasDeviceFeature('haptics')) {
    return;
  }
  getDeviceFeature({ feature: 'haptics', action: 'feedback' })(type).catch(() => {});
}

export default playFeedback;
