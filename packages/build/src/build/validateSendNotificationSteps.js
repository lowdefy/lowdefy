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

function collectSendNotificationSteps(routine, steps) {
  if (type.isArray(routine)) {
    routine.forEach((item) => collectSendNotificationSteps(item, steps));
    return;
  }
  if (type.isObject(routine)) {
    if (routine.type === 'SendNotification') {
      steps.push(routine);
    }
    // Recurse into all values (handles control structures like :then, :else, :try, :catch)
    Object.values(routine).forEach((value) => collectSendNotificationSteps(value, steps));
  }
}

// Runs after buildNotifications (needs context.notificationIds). Validates that
// SendNotification steps with a static notificationId reference an existing
// notification. Operator (dynamic) notificationIds are skipped; they resolve at
// runtime.
function validateSendNotificationSteps({ components, context }) {
  (components.api ?? []).forEach((endpoint) => {
    const steps = [];
    collectSendNotificationSteps(endpoint.routine, steps);

    steps.forEach((step) => {
      const notificationId = step.properties?.notificationId;
      if (!type.isString(notificationId)) return;

      if (!context.notificationIds?.has(notificationId)) {
        throw new ConfigError(
          `SendNotification step "${step.stepId}" at endpoint "${endpoint.endpointId}" references notification "${notificationId}" which does not exist.`,
          { configKey: step['~k'] }
        );
      }
    });
  });
  return components;
}

export default validateSendNotificationSteps;
