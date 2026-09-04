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
import { ConfigError, ConfigWarning } from '@lowdefy/errors';

// One way to name a dev caller: auth.dev.users is the map, auth.dev.browserUser
// names the entry the developer's own browser is signed in as. dev.mockUser
// declared a second, anonymous caller with the same substance and a different
// resolution path, so it is deprecated and removed in v9.
//
// Runs on every build, not only a configured-auth build: dev.users names a
// caller for the headless tools and needs no auth mechanism, so a browserUser
// typo has to be caught whether auth is configured or not.
function validateAuthDev({ components, context }) {
  const dev = components.auth?.dev;
  if (type.isNone(dev)) return components;
  const configKey = dev['~k'] ?? components.auth['~k'];

  if (!type.isNone(dev.mockUser)) {
    if (!type.isNone(dev.browserUser)) {
      throw new ConfigError(
        'Auth "dev.mockUser" and "dev.browserUser" both name the browser\'s caller. Declare the user under "dev.users" and keep "dev.browserUser"; "dev.mockUser" is deprecated.',
        { configKey }
      );
    }
    context.handleWarning(
      new ConfigWarning(
        'Auth "dev.mockUser" is deprecated and is removed in v9. Declare the caller as an entry under "dev.users" and select it with "dev.browserUser: <name>".',
        { configKey, checkSlug: 'auth-dev-mock-user' }
      )
    );
  }

  if (type.isNone(dev.browserUser)) return components;

  if (!type.isString(dev.browserUser)) {
    throw new ConfigError('Auth "dev.browserUser" should be the name of a "dev.users" entry.', {
      received: dev.browserUser,
      configKey,
    });
  }
  const declared = type.isObject(dev.users) ? Object.keys(dev.users) : [];
  // hasOwnProperty rather than a truthy lookup, so a name like "constructor"
  // resolves against the declared entries only, never a prototype member -
  // the same rule resolveDevUser applies at runtime.
  if (!Object.prototype.hasOwnProperty.call(dev.users ?? {}, dev.browserUser)) {
    throw new ConfigError(
      `Auth "dev.browserUser" names "${
        dev.browserUser
      }", which is not declared under "dev.users". Declared: ${
        declared.length === 0 ? 'none' : declared.join(', ')
      }.`,
      { received: dev.browserUser, configKey }
    );
  }

  return components;
}

export default validateAuthDev;
