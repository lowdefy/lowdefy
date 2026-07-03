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

import validateSendNotificationSteps from './validateSendNotificationSteps.js';

function createTestContext({ notificationIds = [] } = {}) {
  return {
    notificationIds: new Set(notificationIds),
  };
}

test('validateSendNotificationSteps passes when no api endpoints are defined', () => {
  const context = createTestContext();
  const components = {};
  expect(() => validateSendNotificationSteps({ components, context })).not.toThrow();
});

test('validateSendNotificationSteps passes when a step references an existing notification', () => {
  const context = createTestContext({ notificationIds: ['task-assigned'] });
  const components = {
    api: [
      {
        endpointId: 'notify',
        routine: [
          {
            stepId: 'send',
            type: 'SendNotification',
            properties: { notificationId: 'task-assigned', data: {} },
          },
        ],
      },
    ],
  };
  expect(() => validateSendNotificationSteps({ components, context })).not.toThrow();
});

test('validateSendNotificationSteps throws when a step references a missing notification', () => {
  const context = createTestContext({ notificationIds: ['task-assigned'] });
  const components = {
    api: [
      {
        endpointId: 'notify',
        routine: [
          {
            stepId: 'send',
            type: 'SendNotification',
            properties: { notificationId: 'missing-notification', data: {} },
          },
        ],
      },
    ],
  };
  expect(() => validateSendNotificationSteps({ components, context })).toThrow(
    'SendNotification step "send" at endpoint "notify" references notification "missing-notification" which does not exist.'
  );
});

test('validateSendNotificationSteps finds steps nested in control structures', () => {
  const context = createTestContext({ notificationIds: [] });
  const components = {
    api: [
      {
        endpointId: 'notify',
        routine: [
          {
            ':if': true,
            ':then': [
              {
                ':try': [
                  {
                    stepId: 'send',
                    type: 'SendNotification',
                    properties: { notificationId: 'missing', data: {} },
                  },
                ],
                ':catch': [],
              },
            ],
          },
        ],
      },
    ],
  };
  expect(() => validateSendNotificationSteps({ components, context })).toThrow(
    'SendNotification step "send" at endpoint "notify" references notification "missing" which does not exist.'
  );
});

test('validateSendNotificationSteps skips steps with operator notificationIds', () => {
  const context = createTestContext({ notificationIds: [] });
  const components = {
    api: [
      {
        endpointId: 'notify',
        routine: [
          {
            stepId: 'send',
            type: 'SendNotification',
            properties: { notificationId: { _payload: 'notificationId' }, data: {} },
          },
        ],
      },
    ],
  };
  expect(() => validateSendNotificationSteps({ components, context })).not.toThrow();
});
