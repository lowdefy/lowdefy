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

import * as Brightness from 'expo-brightness';
import { type } from '@lowdefy/helpers';

/**
 * The brightness device feature (profile field): SetBrightness sets the app's screen brightness,
 * for a scan screen, and gives it back to the system with `reset`. The app's brightness ends when it
 * goes to the background.
 */
function createBrightnessFeature() {
  return {
    async set({ level, reset }) {
      if (reset === true) {
        await Brightness.restoreSystemBrightnessAsync();
        return;
      }
      if (!type.isNumber(level)) {
        throw new Error('SetBrightness requires "level" from 0 to 1, or "reset: true".');
      }
      await Brightness.setBrightnessAsync(Math.min(1, Math.max(0, level)));
    },
  };
}

export default createBrightnessFeature;
