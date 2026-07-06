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

function validNotification(overrides = {}) {
  return {
    id: 'task-assigned',
    type: 'NotificationEmail',
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
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id missing at notification 0.'
  );
});

test('buildNotifications throws when notification id is not a string', () => {
  const context = createTestContext();
  const components = {
    notifications: [{ id: true, type: 'NotificationEmail' }],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id is not a string at notification 0.'
  );
});

test('buildNotifications throws when notification id contains invalid characters', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ id: 'my.notification' })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification id "my.notification" contains invalid characters.'
  );
});

test('buildNotifications throws on duplicate notification ids', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification(), validNotification()],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Duplicate notificationId "task-assigned".'
  );
});

test('buildNotifications throws when notification type is not a string', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ type: 123 })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification type is not a string at notification "task-assigned".'
  );
});

test('buildNotifications throws when properties is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: 'properties' })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification properties is not an object at notification "task-assigned".'
  );
});

test('buildNotifications throws when properties.subject is missing', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: {} })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when properties.subject is an empty string', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: { subject: '' } })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when properties is missing entirely', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ properties: undefined })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification "task-assigned" requires "properties.subject" to be a non-empty string.'
  );
});

test('buildNotifications throws when theme is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ theme: 'dark' })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification theme is not an object at notification "task-assigned".'
  );
});

test('buildNotifications throws when testData is not an object', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification({ testData: ['data'] })],
  };
  expect(() => buildNotifications({ components, context })).toThrow(
    'Notification testData is not an object at notification "task-assigned".'
  );
});

test('buildNotifications renames id to internal format and sets notificationId', () => {
  const context = createTestContext();
  const components = {
    notifications: [validNotification()],
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
  };
  buildNotifications({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({});
});
