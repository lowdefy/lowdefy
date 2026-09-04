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

import collectNotificationMonitors from './collectNotificationMonitors.js';

const context = { keyMap: {}, refMap: {} };

function collect(components) {
  return collectNotificationMonitors({ components, context });
}

test('collectNotificationMonitors returns an entry for every declared notification', () => {
  const monitors = collect({
    notifications: [{ notificationId: 'a' }, { notificationId: 'b' }],
  });
  expect(monitors.map((monitor) => monitor.id)).toEqual([
    'notification:a:delivery_failure',
    'notification:b:delivery_failure',
  ]);
});

test('collectNotificationMonitors finds a RenderNotification step nested inside controls', () => {
  const monitors = collect({
    notifications: [{ notificationId: 'invite' }],
    api: [
      {
        endpointId: 'dispatch',
        routine: [
          {
            ':if': true,
            ':then': [
              {
                ':for': 'item',
                ':in': [],
                ':do': [
                  {
                    id: 'render',
                    type: 'RenderNotification',
                    properties: { notificationId: 'invite' },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  });
  expect(monitors[0].delivery).toEqual({
    owner: 'app',
    endpoints: ['dispatch'],
    auth_flows: [],
  });
  expect(monitors[0].status).toBe('covered');
});

test('collectNotificationMonitors lists every endpoint that renders the same notification once', () => {
  const step = { id: 'render', type: 'RenderNotification', properties: { notificationId: 'x' } };
  const monitors = collect({
    notifications: [{ notificationId: 'x' }],
    api: [
      { endpointId: 'one', routine: [step, { ...step, id: 'render_again' }] },
      { endpointId: 'two', routine: [step] },
    ],
  });
  expect(monitors[0].delivery.endpoints).toEqual(['one', 'two']);
  expect(monitors[0].covered_by).toEqual(['endpoint:one:error_rate', 'endpoint:two:error_rate']);
});

test('collectNotificationMonitors marks an auth email notification no-event-yet and names the connection', () => {
  const monitors = collect({
    notifications: [{ notificationId: 'verify' }],
    auth: { email: { connectionId: 'smtp', templates: { verifyEmail: 'verify' } } },
  });
  expect(monitors[0].status).toBe('no-event-yet');
  expect(monitors[0].delivery).toEqual({
    owner: 'framework',
    endpoints: [],
    auth_flows: ['verifyEmail'],
  });
  expect(monitors[0].note).toMatch('"smtp" connection');
  expect(monitors[0].note).toMatch('notification_delivered');
});

test('collectNotificationMonitors keeps the framework owner when a routine also renders the auth notification', () => {
  const monitors = collect({
    notifications: [{ notificationId: 'verify' }],
    auth: { email: { connectionId: 'smtp', templates: { magicLink: 'verify' } } },
    api: [
      {
        endpointId: 'resend',
        routine: [
          { id: 'render', type: 'RenderNotification', properties: { notificationId: 'verify' } },
        ],
      },
    ],
  });
  expect(monitors[0].status).toBe('no-event-yet');
  expect(monitors[0].delivery).toEqual({
    owner: 'framework',
    endpoints: ['resend'],
    auth_flows: ['magicLink'],
  });
  expect(monitors[0].covered_by).toEqual(['endpoint:resend:error_rate']);
});

test('collectNotificationMonitors reports an operator notificationId as delivery-unknown', () => {
  const monitors = collect({
    notifications: [{ notificationId: 'invite' }],
    api: [
      {
        endpointId: 'dispatch',
        routine: [
          {
            id: 'render',
            type: 'RenderNotification',
            properties: { notificationId: { _payload: 'template' } },
          },
        ],
      },
    ],
  });
  expect(monitors[0].status).toBe('delivery-unknown');
  expect(monitors[0].delivery.owner).toBe('unknown');
  expect(monitors[0].note).toMatch('build the notificationId with an operator');
});

test('collectNotificationMonitors resolves source to file:line for the notification config', () => {
  const monitors = collectNotificationMonitors({
    components: { notifications: [{ notificationId: 'welcome', '~k': 'k1' }] },
    context: {
      keyMap: { k1: { key: 'root.notifications[0:welcome]', '~r': 'r1', '~l': 4 } },
      refMap: { r1: { path: 'notifications/welcome.yaml' } },
    },
  });
  expect(monitors[0].source).toBe('notifications/welcome.yaml:4');
  expect(monitors[0].config_key).toBe('k1');
});
