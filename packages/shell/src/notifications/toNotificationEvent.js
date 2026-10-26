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

/**
 * A notification as the app's events see it: { id, title, body, data, categoryId, badge }.
 *
 * @param {Object} notification An expo-notifications Notification.
 */
function toNotificationEvent(notification) {
  const { content, identifier } = notification.request;
  return {
    id: identifier,
    title: content.title ?? null,
    body: content.body ?? null,
    data: type.isObject(content.data) ? content.data : {},
    categoryId: content.categoryIdentifier ?? null,
    badge: content.badge ?? null,
  };
}

export default toNotificationEvent;
