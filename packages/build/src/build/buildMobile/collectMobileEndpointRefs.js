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
 * The API endpoints mobile config names, which a shell calls with the session token: push token
 * registration, notification buttons, widget sources and background fetch. Each as
 * { endpointId, path, configKey }.
 *
 * @param {Object} mobile The app's mobile config.
 */
function collectMobileEndpointRefs(mobile) {
  const refs = [];
  const add = (endpointId, path, configKey) => {
    if (type.isString(endpointId)) {
      refs.push({ endpointId, path, configKey });
    }
  };
  const { notifications } = mobile;
  if (type.isObject(notifications)) {
    const key = notifications['~k'] ?? mobile['~k'];
    add(notifications.register, 'mobile.notifications.register', key);
    add(notifications.unregister, 'mobile.notifications.unregister', key);
    (notifications.categories ?? []).forEach((category, categoryIndex) => {
      (category.actions ?? []).forEach((action, actionIndex) => {
        add(
          action.endpointId,
          `mobile.notifications.categories[${categoryIndex}].actions[${actionIndex}].endpointId`,
          action['~k'] ?? key
        );
      });
    });
  }
  (mobile.widgets ?? []).forEach((widget, index) => {
    add(widget.endpointId, `mobile.widgets[${index}].endpointId`, widget['~k'] ?? mobile['~k']);
  });
  if (type.isObject(mobile.background)) {
    add(
      mobile.background.endpointId,
      'mobile.background.endpointId',
      mobile.background['~k'] ?? mobile['~k']
    );
  }
  return refs;
}

export default collectMobileEndpointRefs;
