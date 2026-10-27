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

// A stand-in for expo-notifications: nothing is delivered, no response launched the app, and
// permission is not granted, so no push token is registered in tests.
const subscription = () => ({ remove: () => undefined });

module.exports = {
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  addNotificationReceivedListener: subscription,
  addNotificationResponseReceivedListener: subscription,
  addPushTokenListener: subscription,
  cancelAllScheduledNotificationsAsync: async () => undefined,
  cancelScheduledNotificationAsync: async () => undefined,
  clearLastNotificationResponse: () => undefined,
  dismissNotificationAsync: async () => undefined,
  getDevicePushTokenAsync: async () => ({ data: 'device-token' }),
  getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[test]' }),
  getLastNotificationResponse: () => null,
  getPermissionsAsync: async () => ({ granted: false, status: 'undetermined' }),
  requestPermissionsAsync: async () => ({ granted: false, status: 'denied' }),
  scheduleNotificationAsync: async (request) => request.identifier ?? 'notification-id',
  setBadgeCountAsync: async () => true,
  setNotificationCategoryAsync: async () => null,
  setNotificationHandler: () => undefined,
};
