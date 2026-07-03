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

import buildNotifications from './buildNotifications.js';
import createCounter from '../utils/createCounter.js';
import testContext from '../test-utils/testContext.js';

function createTestContext() {
  const context = testContext();
  // testContext does not yet include the notifications counter added to createContext
  context.typeCounters.notifications = createCounter();
  return context;
}

const connections = [
  { id: 'connection:smtp', connectionId: 'smtp', type: 'SMTP' },
  { id: 'connection:mongodb', connectionId: 'mongodb', type: 'MongoDBCollection' },
];

function validNotification(overrides = {}) {
  return {
    id: 'task-assigned',
    type: 'NotificationEmail',
    emailConnectionId: 'smtp',
    dataConnectionId: 'mongodb',
    properties: { subject: 'New Task' },
    ...overrides,
  };
}

test('buildNotifications returns components unchanged when no notifications defined', () => {
  const context = createTestContext();
  const components = {};
  const res = buildNotifications({ components, context });
  expect(res.notifications).toBe(undefined);
  expect(context.notificationIds).toEqual(new Set());
});

test('buildNotifications throws when notifications is not an array', () => {
  const context = createTestContext();
  const components = {
    notifications: 'notifications',
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notifications is not an array.'
  );
});

test('buildNotifications throws when notification id is missing', () => {
  const context = createTestContext();
  const components = {
    notifications: [{ type: 'NotificationEmail' }],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id missing at notification 0.'
  );
});

test('buildNotifications throws when notification id is not a string', () => {
  const context = createTestContext();
  const components = {
    notifications: [{ id: true, type: 'NotificationEmail' }],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id is not a string at notification 0.'
  );
});

test('buildNotifications throws when notification id contains invalid characters', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ id: 'my.notification' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id "my.notification" contains invalid characters.'
  );
});

test('buildNotifications throws on duplicate notification ids', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification(), validNotification()],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Duplicate notificationId "task-assigned".'
  );
});

test('buildNotifications throws when notification type is not a string', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ type: 123 })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification type is not a string at notification "task-assigned".'
  );
});

test('buildNotifications throws when emailConnectionId is missing', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ emailConnectionId: undefined })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification emailConnectionId is not defined at notification "task-assigned".'
  );
});

test('buildNotifications throws when emailConnectionId is not a string', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ emailConnectionId: 123 })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification emailConnectionId is not a string at notification "task-assigned".'
  );
});

test('buildNotifications throws when emailConnectionId references a connection which does not exist', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ emailConnectionId: 'missing' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" references emailConnectionId "missing" which does not exist.'
  );
});

test('buildNotifications throws when dataConnectionId is missing', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ dataConnectionId: undefined })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification dataConnectionId is not defined at notification "task-assigned".'
  );
});

test('buildNotifications throws when dataConnectionId references a connection which does not exist', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ dataConnectionId: 'missing' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" references dataConnectionId "missing" which does not exist.'
  );
});

test('buildNotifications passes when connection ids match connections with plain ids', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification()],
    connections: [
      { id: 'smtp', type: 'SMTP' },
      { id: 'mongodb', type: 'MongoDBCollection' },
    ],
  };
  const res = buildNotifications({ components, context });
  expect(res.notifications[0].emailConnectionId).toBe('smtp');
});

test('buildNotifications defaults delivery to inline', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification()],
    connections,
  };
  const res = buildNotifications({ components, context });
  expect(res.notifications[0].delivery).toBe('inline');
});

test('buildNotifications accepts delivery deferred', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ delivery: 'deferred' })],
    connections,
  };
  const res = buildNotifications({ components, context });
  expect(res.notifications[0].delivery).toBe('deferred');
});

test('buildNotifications throws when delivery is not a valid value', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ delivery: 'later' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification delivery is not one of "inline" or "deferred" at notification "task-assigned".'
  );
});

test('buildNotifications throws when properties is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: 'properties' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification properties is not an object at notification "task-assigned".'
  );
});

test('buildNotifications throws when properties.subject is missing', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: {} })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when properties.subject is an empty string', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: { subject: '' } })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when properties is missing entirely', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: undefined })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when theme is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ theme: 'dark' })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification theme is not an object at notification "task-assigned".'
  );
});

test('buildNotifications throws when testData is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ testData: ['data'] })],
    connections,
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification testData is not an object at notification "task-assigned".'
  );
});

test('buildNotifications renames id to internal format and sets notificationId', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification()],
    connections,
  };
  const res = buildNotifications({ components, context });
  expect(res.notifications[0].id).toBe('notification:task-assigned');
  expect(res.notifications[0].notificationId).toBe('task-assigned');
});

test('buildNotifications populates context.notificationIds with original ids', () => {
  const context = createTestContext();
  const components = {
    notifications: [
      validNotification(),
      validNotification({ id: 'weekly-digest', type: 'DigestEmail' }),
    ],
    connections,
  };
  buildNotifications({ components, context });
  expect(context.notificationIds).toEqual(new Set(['task-assigned', 'weekly-digest']));
});

test('buildNotifications counts notification types in context.typeCounters.notifications', () => {
  const context = createTestContext();
  const components = {
    notifications: [
      validNotification(),
      validNotification({ id: 'task-done' }),
      validNotification({ id: 'weekly-digest', type: 'DigestEmail' }),
    ],
    connections,
  };
  buildNotifications({ components, context });
  expect(context.typeCounters.notifications.getCounts()).toEqual({
    NotificationEmail: 2,
    DigestEmail: 1,
  });
});

test('buildNotifications does not count operators in notification properties', () => {
  const context = createTestContext();
  const components = {
    notifications: [
      validNotification({
        properties: {
          subject: 'New Task: {{ task.title }}',
          message: 'Hi {{ contact.profile.name }}',
          metadata: [{ label: 'Ref', value: '{{ task._id }}' }],
        },
      }),
    ],
    connections,
  };
  buildNotifications({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({});
});
