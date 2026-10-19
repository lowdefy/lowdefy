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

// Data set users are injected callers, the shape a journey's inline `user:` takes. They carry no
// credentials: a journey that signs in through the app is an auth journey and stays off data sets.
function validateDataSetUsers({ users, fail }) {
  if (type.isNone(users)) return {};
  if (!type.isObject(users)) {
    fail('"users" should be an object keyed by user name.');
  }
  Object.entries(users).forEach(([userName, user]) => {
    if (userName === 'none') {
      fail('users key "none" is reserved: `user: none` means signed out.');
    }
    if (userName.startsWith('_')) {
      fail(`users key "${userName}" looks like an operator; data sets are plain YAML.`);
    }
    if (!type.isObject(user)) {
      fail(
        `users.${userName} should be an inline user object, e.g. { id: u_1, roles: [admin] }. Received ${JSON.stringify(
          user
        )}.`
      );
    }
    Object.keys(user).forEach((key) => {
      if (key.startsWith('_')) {
        fail(`users.${userName} key "${key}" looks like an operator; data sets are plain YAML.`);
      }
    });
    if (Object.prototype.hasOwnProperty.call(user, 'password')) {
      fail(
        `users.${userName} has a "password". Data set users are injected callers and carry no credentials.`
      );
    }
  });
  return users;
}

export default validateDataSetUsers;
