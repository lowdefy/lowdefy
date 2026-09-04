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

import collectNotificationDelivery from './collectNotificationDelivery.js';
import resolveMonitorSource from './resolveMonitorSource.js';

/*
  A notification is not a unit of work - nothing "runs" it - so it has no event
  of its own. What can fail is its delivery, and delivery has an owner:

  - The app, for a notification a routine renders: RenderNotification only
    renders, and the routine sends the result with the request step that
    follows. A failed send fails that step, so the endpoint's own monitor
    already covers it. The entry names that monitor rather than inventing a
    second one over the same lines.
  - The framework, for a notification wired to an auth email flow: the server
    sends it itself through auth.email.connectionId, bypassing the request
    resolver, so no request line covers it. That send emits its own wide event
    instead (packages/api/src/routes/auth/createSendEmail.js writes
    notification_delivered / notification_failed), and this is the one
    notification entry with a rule of its own.

  Every notification gets an entry either way: the artifact is the app's full
  inventory of what is worth watching, and an entry that says who delivers and
  what watches it is what tells a silent notification from a covered one.
*/
function describeDelivery({ notificationId, sites, dynamicEndpoints, authConnectionId, defaults }) {
  const endpoints = sites?.endpoints ?? [];
  const auth_flows = sites?.auth_flows ?? [];
  const covered_by = endpoints.map((endpointId) => `endpoint:${endpointId}:error_rate`);

  if (auth_flows.length > 0) {
    const connection = authConnectionId ?? 'auth.email.connectionId';
    const filter = { notification_id: notificationId };
    return {
      delivery: { owner: 'framework', endpoints, auth_flows },
      covered_by,
      event: 'notification_failed',
      description: `Auth email "${notificationId}" is failing to send more than ${
        defaults.error_rate * 100
      }% of the time.`,
      rule: {
        type: 'error_rate',
        window_minutes: defaults.window_minutes,
        threshold: defaults.error_rate,
        comparison: 'above',
        failure: { event: 'notification_failed', filter },
        total: { events: ['notification_delivered', 'notification_failed'], filter },
      },
      status: 'active',
      note: `Delivered by the framework: auth email flow(s) ${auth_flows.join(
        ', '
      )} send this notification through the "${connection}" connection, outside the request resolver, so the send emits its own "notification_delivered" / "notification_failed" event and this rule watches it.`,
    };
  }

  if (endpoints.length > 0) {
    return {
      delivery: { owner: 'app', endpoints, auth_flows },
      covered_by,
      status: 'covered',
      note: `Delivered by the app: endpoint(s) ${endpoints.join(
        ', '
      )} render this notification and send it with a request step, so a failed send fails that step and its endpoint. Watched by ${covered_by.join(
        ', '
      )}. Lowdefy writes no notification-scoped delivery event.`,
    };
  }

  if (dynamicEndpoints.length > 0) {
    return {
      delivery: { owner: 'unknown', endpoints, auth_flows },
      covered_by: dynamicEndpoints.map((endpointId) => `endpoint:${endpointId}:error_rate`),
      status: 'delivery-unknown',
      note: `Endpoint(s) ${dynamicEndpoints.join(
        ', '
      )} build the notificationId with an operator, so the build cannot tell whether "${notificationId}" is delivered there. Those endpoints' own monitors cover the sends they make.`,
    };
  }

  return {
    delivery: { owner: 'none', endpoints, auth_flows },
    covered_by,
    status: 'delivery-unknown',
    note: `Nothing delivers "${notificationId}": no routine renders it and no auth email flow uses it. Render it with a RenderNotification step, or remove it.`,
  };
}

function collectNotificationMonitors({ components, context, defaults }) {
  const { delivery, dynamicEndpoints, authConnectionId } = collectNotificationDelivery({
    components,
  });
  return (components.notifications ?? [])
    .filter((notification) => !type.isNone(notification?.notificationId ?? notification?.id))
    .map((notification) => {
      const notificationId = notification.notificationId ?? notification.id;
      const configKey = notification['~k'];
      const described = describeDelivery({
        notificationId,
        sites: delivery.get(notificationId),
        dynamicEndpoints,
        authConnectionId,
        defaults,
      });
      return {
        id: `notification:${notificationId}:delivery_failure`,
        unit: { type: 'notification', id: notificationId },
        event: described.event ?? null,
        description:
          described.description ?? `Notification "${notificationId}" is failing to deliver.`,
        rule: described.rule ?? null,
        config_key: configKey ?? null,
        source: resolveMonitorSource({ configKey, context }),
        delivery: described.delivery,
        covered_by: described.covered_by,
        status: described.status,
        note: described.note,
      };
    });
}

export default collectNotificationMonitors;
