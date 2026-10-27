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

import { expect, test } from 'vitest';
import validateMobileNotifications from './validateMobileNotifications.js';

// No errors array: collectExceptions throws the first error, as a build without one would.
const context = {};

test('validateMobileNotifications accepts endpoints, foreground and categories of buttons', () => {
  expect(() =>
    validateMobileNotifications({
      context,
      notifications: {
        register: 'register-device',
        unregister: 'unregister-device',
        foreground: 'silent',
        categories: [
          {
            id: 'approval',
            actions: [
              { id: 'approve', title: 'Approve', endpointId: 'approve-request' },
              {
                id: 'reply',
                title: 'Reply',
                input: { placeholder: 'Message' },
                endpointId: 'reply',
              },
              { id: 'snooze', title: 'Snooze', snooze: 60 },
            ],
          },
        ],
      },
    })
  ).not.toThrow();
});

test('validateMobileNotifications refuses an unknown key', () => {
  expect(() => validateMobileNotifications({ context, notifications: { badge: true } })).toThrow(
    'App "mobile.notifications" has unknown key "badge".'
  );
});

test('validateMobileNotifications refuses a foreground other than banner or silent', () => {
  expect(() =>
    validateMobileNotifications({ context, notifications: { foreground: 'alert' } })
  ).toThrow('App "mobile.notifications.foreground" should be one of banner, silent.');
});

test('validateMobileNotifications refuses a category with more than four buttons', () => {
  const actions = [1, 2, 3, 4, 5].map((n) => ({ id: `a${n}`, title: `A${n}` }));
  expect(() =>
    validateMobileNotifications({
      context,
      notifications: { categories: [{ id: 'many', actions }] },
    })
  ).toThrow('App "mobile.notifications.categories[0].actions" should have 1 to 4 actions.');
});

test('validateMobileNotifications refuses a snooze button that also calls an endpoint', () => {
  expect(() =>
    validateMobileNotifications({
      context,
      notifications: {
        categories: [
          { id: 'c', actions: [{ id: 's', title: 'Snooze', snooze: 10, endpointId: 'x' }] },
        ],
      },
    })
  ).toThrow('takes no "endpointId" or "input"');
});

test('validateMobileNotifications refuses two categories with one id', () => {
  const category = { id: 'same', actions: [{ id: 'a', title: 'A' }] };
  expect(() =>
    validateMobileNotifications({ context, notifications: { categories: [category, category] } })
  ).toThrow('App "mobile.notifications.categories[1].id" "same" is used twice.');
});
