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

import * as Notifications from 'expo-notifications';
import { type } from '@lowdefy/helpers';

import { getCurrentApp } from '../native/currentApp.js';
import registerPushToken from './registerPushToken.js';
import toScheduleRequest from './toScheduleRequest.js';

/**
 * The notifications device feature the native actions use (ScheduleNotification,
 * CancelNotification, SetBadgeCount, RequestNotificationPermission).
 */
function createNotificationsFeature() {
  return {
    async schedule(params) {
      const id = await Notifications.scheduleNotificationAsync(toScheduleRequest(params));
      return { id };
    },
    async cancel({ all, id }) {
      if (all === true) {
        await Notifications.cancelAllScheduledNotificationsAsync();
        return;
      }
      if (!type.isString(id)) {
        throw new Error('CancelNotification requires "id", or "all: true".');
      }
      await Notifications.cancelScheduledNotificationAsync(id);
    },
    async setBadgeCount({ count }) {
      await Notifications.setBadgeCountAsync(count);
    },
    async requestPermission() {
      const { granted, status } = await Notifications.requestPermissionsAsync();
      if (granted) {
        registerPushToken({ app: await getCurrentApp() }).catch(() => {});
      }
      return { granted, status };
    },
  };
}

export default createNotificationsFeature;
