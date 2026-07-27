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

function createAuthorize({ session, system = false }) {
  // Next-auth getSession provides a session object if the user is authenticated
  // else session will be null

  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];
  if (!Array.isArray(roles)) {
    throw new ConfigError('session.user.roles must be an array of strings.', {
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
  // Steps that render as their invoker (RenderReport) need to know whether they
  // run in a system context. Expose it off the authorize function so it is
  // derived from the same flag wherever a system context is created.
  authorize.system = system === true;

  return authorize;
}

export default createAuthorize;
