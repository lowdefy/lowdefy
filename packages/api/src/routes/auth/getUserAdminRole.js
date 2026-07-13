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

// The engine retains the configured auth.userAdminRole per auth instance -
// the step interface layer (handleAuthStep) reads it synchronously to enforce
// the user-administration floor on user-initiated auth steps. null means
// unconfigured, which is a meaningful state: user-initiated admin steps are
// refused until the app declares who administers users.
const userAdminRoleByAuth = new WeakMap();

function registerUserAdminRole({ auth, userAdminRole }) {
  userAdminRoleByAuth.set(auth, userAdminRole ?? null);
}

function getUserAdminRole({ auth }) {
  if (type.isNone(auth)) {
    return null;
  }
  return userAdminRoleByAuth.get(auth) ?? null;
}

export { registerUserAdminRole };
export default getUserAdminRole;
