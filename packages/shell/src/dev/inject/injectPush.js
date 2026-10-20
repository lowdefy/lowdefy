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

import { getCurrentApp } from '../../native/currentApp.js';
import handleNotificationResponse from '../../notifications/handleNotificationResponse.js';

/**
 * Lowdefy Dev's push injection: shows `{ title, body, data, categoryId }` as a notification now,
 * as a push arriving with the app open would (the app's onNotification fires). With `open: true`
 * it is then tapped (data.path opens, onNotificationAction fires with actionId default); with
 * `actionId` (and `text` for a reply) that button is pressed instead, as the person would.
 *
 * @param {Object} value
 */
async function injectPush(value) {
  if (!type.isObject(value) || !(type.isString(value.title) || type.isString(value.body))) {
    throw new Error(
      `A push injection needs { title, body, data?, categoryId?, open?, actionId?, text? }. Received ${JSON.stringify(
        value
      )}.`
    );
  }
  const content = {
    title: value.title,
    body: value.body,
    data: value.data ?? {},
    categoryIdentifier: value.categoryId,
  };
  const id = await Notifications.scheduleNotificationAsync({ content, trigger: null });
  if (value.open !== true && !type.isString(value.actionId)) {
    return { ok: true, kind: 'push', id };
  }
  await handleNotificationResponse({
    app: await getCurrentApp(),
    response: {
      actionIdentifier: value.actionId ?? Notifications.DEFAULT_ACTION_IDENTIFIER,
      notification: { request: { identifier: id, content } },
      userText: value.text,
    },
  });
  return { ok: true, kind: 'push', id, responded: value.actionId ?? 'default' };
}

export default injectPush;
