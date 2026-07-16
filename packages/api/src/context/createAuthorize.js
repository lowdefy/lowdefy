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

// createAuthorize is called with the context object on every path
// (createApiContext, createSystemContext, and the runners), so `system` is read
// straight off context.system - the single run-level trust marker every
// authorization layer reads (Decisions 1, 2).
function createAuthorize({ user, system }) {
  // resolveAuthentication is the single writer of context.user - a resolved
  // caller object when authenticated, else null.
  const authenticated = !type.isNone(user);
  const roles = user?.roles ?? [];
  if (!Array.isArray(roles) || roles.some((role) => !type.isString(role))) {
    throw new ConfigError('user.roles must be an array of strings.', {
      received: roles,
    });
  }

  function authorize(config) {
    // In a system context (context.system === true) there is no session and no
    // caller, so `auth.public` / `auth.roles` - which ask "does this caller's
    // session carry the required roles?" - is undefined, not denied. Endpoint
    // role-authorization is skipped, not satisfied by a synthetic role:
    // "system" is never a role, it is the absence of a principal (Decision 2).
    if (system === true) return true;
    const { auth } = config;
    if (auth.public === true) return true;
    if (auth.public === false) {
      if (auth.roles) {
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      return authenticated;
    }
    throw new ConfigError('auth.public must be true or false.', {
      received: auth.public,
      configKey: config['~k'],
    });
  }
  return authorize;
}

export default createAuthorize;
