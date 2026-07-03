/* eslint-disable no-param-reassign */

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
import { ConfigError } from '@lowdefy/errors';
import createCheckDuplicateId from '../utils/createCheckDuplicateId.js';
import validateId from '../utils/validateId.js';

const deliveryValues = ['inline', 'deferred'];

function validateConnectionRef({ notification, field, configKey, components }) {
  const connectionId = notification[field];
  if (type.isNone(connectionId)) {
    throw new ConfigError(
      `Notification ${field} is not defined at notification "${notification.id}".`,
      { configKey }
    );
  }
  if (!type.isString(connectionId)) {
    throw new ConfigError(
      `Notification ${field} is not a string at notification "${notification.id}".`,
      { received: connectionId, configKey }
    );
  }
  // Connections may have been renamed by buildConnections:
  //   connection.connectionId = original id, connection.id = 'connection:' + original id
  const connectionExists = (components.connections ?? []).some(
    (c) => c.id === connectionId || c.connectionId === connectionId
  );
  if (!connectionExists) {
    throw new ConfigError(
      `Notification "${notification.id}" references ${field} "${connectionId}" which does not exist.`,
      { configKey, checkSlug: 'connection-refs' }
    );
  }
}

function buildNotifications({ components, context }) {
  if (components.notifications && !type.isArray(components.notifications)) {
    throw new ConfigError('Notifications is not an array.', {
      received: components.notifications,
    });
  }
  const notifications = type.isArray(components.notifications) ? components.notifications : [];

  context.notificationIds = new Set();

  const checkDuplicateNotificationId = createCheckDuplicateId({
    message: 'Duplicate notificationId "{{ id }}".',
  });

  notifications.forEach((notification, index) => {
    const configKey = notification['~k'];

    if (type.isUndefined(notification.id)) {
      throw new ConfigError(`Notification id missing at notification ${index}.`, { configKey });
    }
    if (!type.isString(notification.id)) {
      throw new ConfigError(`Notification id is not a string at notification ${index}.`, {
        received: notification.id,
        configKey,
      });
    }
    validateId({ id: notification.id, field: 'Notification id', configKey });
    checkDuplicateNotificationId({ id: notification.id, configKey });

    if (!type.isString(notification.type)) {
      throw new ConfigError(
        `Notification type is not a string at notification "${notification.id}".`,
        { received: notification.type, configKey }
      );
    }

    // Track type usage for buildTypes validation
    context.typeCounters.notifications.increment(notification.type, configKey);

    validateConnectionRef({ notification, field: 'emailConnectionId', configKey, components });
    validateConnectionRef({ notification, field: 'dataConnectionId', configKey, components });

    if (type.isNone(notification.delivery)) {
      notification.delivery = 'inline';
    }
    if (!deliveryValues.includes(notification.delivery)) {
      throw new ConfigError(
        `Notification delivery is not one of "inline" or "deferred" at notification "${notification.id}".`,
        { received: notification.delivery, configKey }
      );
    }

    if (type.isNone(notification.properties)) {
      notification.properties = {};
    }
    if (!type.isObject(notification.properties)) {
      throw new ConfigError(
        `Notification properties is not an object at notification "${notification.id}".`,
        { received: notification.properties, configKey }
      );
    }

    // subject is a framework contract, independent of the template type's own schema —
    // the runtime reads it for the stored record and the mail header.
    if (!type.isString(notification.properties.subject) || notification.properties.subject === '') {
      throw new ConfigError(
        `Notification "${notification.id}" requires "properties.subject" to be a non-empty string.`,
        { received: notification.properties.subject, configKey }
      );
    }

    if (!type.isNone(notification.theme) && !type.isObject(notification.theme)) {
      throw new ConfigError(
        `Notification theme is not an object at notification "${notification.id}".`,
        { received: notification.theme, configKey }
      );
    }

    if (!type.isNone(notification.testData) && !type.isObject(notification.testData)) {
      throw new ConfigError(
        `Notification testData is not an object at notification "${notification.id}".`,
        { received: notification.testData, configKey }
      );
    }

    // Rename id to internal format
    notification.notificationId = notification.id;
    context.notificationIds.add(notification.notificationId);
    notification.id = `notification:${notification.notificationId}`;

    // No countOperators here — notification properties are nunjucks data templates,
    // not operator config; there is no runtime operator evaluation inside them.
  });

  return components;
}

export default buildNotifications;
