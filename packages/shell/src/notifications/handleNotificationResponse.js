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

import callEndpoint from '../native/callEndpoint.js';
import getCategoryAction from './getCategoryAction.js';
import openPath from '../native/openPath.js';
import toNotificationEvent from './toNotificationEvent.js';

/**
 * What a tap or a button on a notification does:
 * - a button with `snooze`: shows the same notification again that many minutes later, on the
 *   phone alone;
 * - a button with `endpointId` (Approve, or Reply with its typed text): calls the endpoint with
 *   { actionId, categoryId, text, data, notification }, with the app in the background;
 * - a tap, or any other button: opens `data.path` (for a tap) and fires onNotificationAction with
 *   { actionId (default for a tap), categoryId, text, data, notification }.
 *
 * @param {Object} params
 * @param {Object} params.app The open app (currentApp.js).
 * @param {{ actionIdentifier: string, notification: Object, userText?: string }} params.response
 */
async function handleNotificationResponse({ app, response }) {
  const notification = toNotificationEvent(response.notification);
  const tapped = response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER;
  const actionId = tapped ? 'default' : response.actionIdentifier;
  const event = {
    actionId,
    categoryId: notification.categoryId,
    data: notification.data,
    notification,
    text: response.userText ?? null,
  };
  const action = tapped
    ? null
    : getCategoryAction({
        actionId,
        categoryId: notification.categoryId,
        notifications: app.session.getState().root?.notifications,
      });
  if (action !== null && action.snooze !== null) {
    const { content } = response.notification.request;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content.title,
        body: content.body,
        data: content.data,
        categoryIdentifier: content.categoryIdentifier,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: action.snooze * 60,
      },
    });
    return;
  }
  if (action !== null && action.endpointId !== null) {
    await callEndpoint({ app, endpointId: action.endpointId, payload: event });
    await Notifications.dismissNotificationAsync(notification.id);
    return;
  }
  if (tapped) {
    openPath({ app, path: notification.data.path });
  }
  await app.triggerAppEvent({ name: 'onNotificationAction', event });
}

export default handleNotificationResponse;
