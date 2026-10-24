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
import validateMobileEndpointRefs from './validateMobileEndpointRefs.js';

test('validateMobileEndpointRefs refuses an endpoint mobile config names that does not exist', () => {
  const context = { errors: [] };
  validateMobileEndpointRefs({
    components: {
      api: [{ endpointId: 'register-device' }],
      mobile: {
        notifications: {
          register: 'register-device',
          categories: [{ id: 'c', actions: [{ id: 'a', title: 'A', endpointId: 'approve' }] }],
        },
        widgets: [{ id: 'w', title: 'W', endpointId: 'open-count' }],
      },
    },
    context,
  });
  expect(context.errors.map((error) => error.message)).toEqual([
    'App "mobile.notifications.categories[0].actions[0].endpointId" names API endpoint "approve", which does not exist. Add it to "api".',
    'App "mobile.widgets[0].endpointId" names API endpoint "open-count", which does not exist. Add it to "api".',
  ]);
});

test('validateMobileEndpointRefs leaves an app without mobile config alone', () => {
  const context = { errors: [] };
  validateMobileEndpointRefs({ components: {}, context });
  expect(context.errors).toEqual([]);
});
