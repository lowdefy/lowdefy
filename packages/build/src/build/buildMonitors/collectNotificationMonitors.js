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

import resolveMonitorSource from './resolveMonitorSource.js';

// A notification has no delivery event to watch yet. RenderNotification only
// renders — the send is whatever request the routine makes afterwards — and it
// emits `debug_start_render_notification` / `debug_end_render_notification`,
// which carry no success field and are dropped at anything above debug level.
// The entry is still written: the artifact is the app's full inventory of
// units worth watching, and an entry that says why it cannot be watched is how
// the gap gets closed rather than forgotten.
const NO_EVENT_NOTE =
  'No delivery event is emitted yet. RenderNotification logs only debug lines; add a wide `notification_delivered` / `notification_failed` event to the notification path to make this monitor pushable.';

function collectNotificationMonitors({ components, context }) {
  return (components.notifications ?? [])
    .filter((notification) => !type.isNone(notification?.notificationId ?? notification?.id))
    .map((notification) => {
      const notificationId = notification.notificationId ?? notification.id;
      const configKey = notification['~k'];
      return {
        id: `notification:${notificationId}:delivery_failure`,
        unit: { type: 'notification', id: notificationId },
        event: null,
        description: `Notification "${notificationId}" is failing to deliver.`,
        rule: null,
        config_key: configKey ?? null,
        source: resolveMonitorSource({ configKey, context }),
        status: 'no-event-yet',
        note: NO_EVENT_NOTE,
      };
    });
}

export default collectNotificationMonitors;
