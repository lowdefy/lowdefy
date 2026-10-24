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

import { ConfigError } from '@lowdefy/errors';

import {
  checkArray,
  checkKeys,
  checkObject,
  checkOptionalBoolean,
  checkOptionalEnum,
  checkOptionalNumber,
  checkOptionalString,
  checkString,
  checkUniqueIds,
} from './mobileChecks.js';

const NOTIFICATION_KEYS = ['register', 'unregister', 'foreground', 'categories'];
const CATEGORY_KEYS = ['id', 'actions'];
const ACTION_KEYS = [
  'id',
  'title',
  'endpointId',
  'input',
  'snooze',
  'destructive',
  'authenticationRequired',
];
const INPUT_KEYS = ['placeholder', 'buttonTitle'];
// iOS shows at most four actions on a notification.
const MAX_ACTIONS = 4;

function validateAction({ action, path, configKey }) {
  checkObject({ value: action, path, configKey });
  const actionKey = action['~k'] ?? configKey;
  checkKeys({ object: action, allowed: ACTION_KEYS, path, configKey: actionKey });
  checkString({ value: action.id, path: `${path}.id`, configKey: actionKey });
  checkString({ value: action.title, path: `${path}.title`, configKey: actionKey });
  checkOptionalString({ value: action.endpointId, path: `${path}.endpointId`, configKey: actionKey });
  checkOptionalNumber({ value: action.snooze, minimum: 1, path: `${path}.snooze`, configKey: actionKey });
  checkOptionalBoolean({
    value: action.destructive,
    path: `${path}.destructive`,
    configKey: actionKey,
  });
  checkOptionalBoolean({
    value: action.authenticationRequired,
    path: `${path}.authenticationRequired`,
    configKey: actionKey,
  });
  if (action.input !== undefined) {
    checkObject({ value: action.input, path: `${path}.input`, configKey: actionKey });
    checkKeys({ object: action.input, allowed: INPUT_KEYS, path: `${path}.input`, configKey: actionKey });
    INPUT_KEYS.forEach((key) =>
      checkOptionalString({ value: action.input[key], path: `${path}.input.${key}`, configKey: actionKey })
    );
  }
  // A snoozed notification is shown again by the phone; it calls no endpoint and opens nothing.
  if (action.snooze !== undefined && (action.endpointId !== undefined || action.input !== undefined)) {
    throw new ConfigError(
      `App "${path}" with "snooze" shows the notification again later, so it takes no "endpointId" or "input".`,
      { configKey: actionKey }
    );
  }
}

function validateCategory({ category, path, configKey }) {
  checkObject({ value: category, path, configKey });
  const categoryKey = category['~k'] ?? configKey;
  checkKeys({ object: category, allowed: CATEGORY_KEYS, path, configKey: categoryKey });
  checkString({ value: category.id, path: `${path}.id`, configKey: categoryKey });
  checkArray({ value: category.actions, path: `${path}.actions`, configKey: categoryKey });
  if (category.actions.length === 0 || category.actions.length > MAX_ACTIONS) {
    throw new ConfigError(
      `App "${path}.actions" should have 1 to ${MAX_ACTIONS} actions. Received ${category.actions.length}.`,
      { configKey: categoryKey }
    );
  }
  category.actions.forEach((action, index) =>
    validateAction({ action, path: `${path}.actions[${index}]`, configKey: categoryKey })
  );
  checkUniqueIds({ items: category.actions, path: `${path}.actions`, configKey: categoryKey });
}

// mobile.notifications: the endpoints push tokens are registered with, how a notification
// received while the app is open shows, and the categories whose action buttons a push or a
// ScheduleNotification names.
function validateMobileNotifications({ notifications, configKey }) {
  const path = 'mobile.notifications';
  checkObject({ value: notifications, path, configKey });
  const key = notifications['~k'] ?? configKey;
  checkKeys({ object: notifications, allowed: NOTIFICATION_KEYS, path, configKey: key });
  checkOptionalString({ value: notifications.register, path: `${path}.register`, configKey: key });
  checkOptionalString({
    value: notifications.unregister,
    path: `${path}.unregister`,
    configKey: key,
  });
  checkOptionalEnum({
    value: notifications.foreground,
    allowed: ['banner', 'silent'],
    path: `${path}.foreground`,
    configKey: key,
  });
  if (notifications.categories !== undefined) {
    checkArray({ value: notifications.categories, path: `${path}.categories`, configKey: key });
    notifications.categories.forEach((category, index) =>
      validateCategory({ category, path: `${path}.categories[${index}]`, configKey: key })
    );
    checkUniqueIds({ items: notifications.categories, path: `${path}.categories`, configKey: key });
  }
}

export default validateMobileNotifications;
