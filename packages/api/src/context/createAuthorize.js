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

function createAuthorize({ user, system = false }) {
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
    // A system context (scheduled, webhook, detached runs) was authorized at the
    // transport layer, so nested endpoint calls are never gated on a user session.
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
