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

import * as Haptics from 'expo-haptics';

const IMPACTS = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};
const NOTIFICATIONS = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

/**
 * The haptics device feature: `(type) => Promise`, a selection tick, an impact or a notification
 * (blocks-native's Haptic action and the native controls' feedback).
 */
function createHapticsFeature() {
  return function playHaptic(hapticType) {
    if (hapticType === 'selection') {
      return Haptics.selectionAsync();
    }
    if (NOTIFICATIONS[hapticType] !== undefined) {
      return Haptics.notificationAsync(NOTIFICATIONS[hapticType]);
    }
    return Haptics.impactAsync(IMPACTS[hapticType] ?? IMPACTS.light);
  };
}

export default createHapticsFeature;
