/* eslint-disable no-param-reassign */

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
import { validate } from '@lowdefy/ajv';
import { ConfigError } from '@lowdefy/errors';
import lowdefySchema from '../../lowdefySchema.js';
import isAuthConfigured from './isAuthConfigured.js';
import validateMutualExclusivity from './validateMutualExclusivity.js';

function validateSchema({ components }) {
  const { valid, errors } = validate({
    schema: lowdefySchema.definitions.authConfig,
    data: components.auth,
    returnErrors: true,
  });

  if (!valid) {
    errors.forEach((error) => {
      // Try to get configKey from the item in the error path
      const instancePath = error.instancePath.split('/').filter(Boolean);
      let configKey = components.auth['~k'];
      let currentData = components.auth;

      for (const part of instancePath) {
        if (type.isArray(currentData)) {
          const index = parseInt(part, 10);
          currentData = currentData[index];
        } else {
          currentData = currentData?.[part];
        }
        if (currentData?.['~k']) {
          configKey = currentData['~k'];
        }
      }

      throw new ConfigError(`Auth ${error.message}.`, { configKey });
    });
  }
}

// Validation runs on any non-empty auth block and enforces that it forms a
// working auth setup. A block that sets auth options but doesn't cohere into
// one is a build error - there is no silent middle where partial auth config
// does nothing.
function validateAuthConfig({ components }) {
  if (type.isNone(components.auth)) {
    components.auth = {};
  }
  if (!type.isObject(components.auth)) {
    throw new ConfigError('lowdefy.auth is not an object.', { configKey: components['~k'] });
  }

  if (!isAuthConfigured({ components })) {
    return components;
  }

  validateSchema({ components });

  const auth = components.auth;
  const configKey = auth['~k'];

  const emailAndPasswordEnabled = auth.emailAndPassword?.enabled === true;
  const magicLinkEnabled = auth.magicLink?.enabled === true;
  const hasProviders = type.isArray(auth.providers) && auth.providers.length > 0;
  const hasLoginMethod = emailAndPasswordEnabled || magicLinkEnabled || hasProviders;

  // dev.mockUser is a server-dev-only bypass, not a mechanism - a block whose
  // only substance is dev.mockUser still fails this check.
  if (!hasLoginMethod) {
    throw new ConfigError(
      'Auth is configured without an authentication mechanism. Configure a login method ("emailAndPassword.enabled: true" or "magicLink.enabled: true") or an OAuth provider in "providers".',
      { configKey }
    );
  }

  if (type.isNone(auth.secret)) {
    throw new ConfigError(
      'Auth "secret" is required when auth is configured. Reference it with the _secret operator.',
      { configKey }
    );
  }

  // A session-based mechanism (login method or OAuth provider) requires a
  // database for users, sessions and accounts.
  if (hasLoginMethod && type.isNone(auth.database)) {
    throw new ConfigError(
      'Auth "database" is required when a login method or provider is configured.',
      { configKey }
    );
  }

  const requireEmailVerification = auth.emailAndPassword?.requireEmailVerification === true;
  if ((magicLinkEnabled || requireEmailVerification) && type.isNone(auth.email)) {
    throw new ConfigError(
      'Auth "email" is required when "magicLink" is enabled or "emailAndPassword.requireEmailVerification" is true.',
      { configKey }
    );
  }

  // An explicitly pinned deployment is the multi-app case, where silently
  // pinning the auto-seeded "default" org would point the app at the wrong
  // organization - the slug must be stated. An omitted block (or omitted
  // policy) is the single-org app, which defaults to the seeded org.
  if (auth.organizations?.policy === 'pinned' && type.isNone(auth.organizations.org)) {
    throw new ConfigError(
      'Auth "organizations.org" is required when "organizations.policy" is "pinned". Set the organization slug the deployment pins.',
      { configKey: auth.organizations['~k'] ?? configKey }
    );
  }
  if (auth.organizations?.policy === 'tenant' && !type.isNone(auth.organizations.org)) {
    throw new ConfigError(
      'Auth "organizations.org" applies only to the "pinned" policy - under "tenant" organizations are created per user at first session.',
      { configKey: auth.organizations['~k'] ?? configKey }
    );
  }

  validateMutualExclusivity({ components, entity: 'api' });
  validateMutualExclusivity({ components, entity: 'pages' });
  validateMutualExclusivity({ components, entity: 'websockets' });

  return components;
}

export default validateAuthConfig;
