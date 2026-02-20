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
import validateMutualExclusivity from './validateMutualExclusivity.js';

function validateAuthConfig({ components, context }) {
  if (type.isNone(components.auth)) {
    components.auth = {};
  }
  if (!type.isObject(components.auth)) {
    throw new ConfigError('lowdefy.auth is not an object.', { configKey: components['~k'] });
  }
  if (type.isNone(components.auth.api)) {
    components.auth.api = {};
  }
  if (type.isNone(components.auth.api.roles)) {
    components.auth.api.roles = {};
  }
  if (type.isNone(components.auth.authPages)) {
    components.auth.authPages = {};
  }
  if (type.isNone(components.auth.pages)) {
    components.auth.pages = {};
  }
  if (type.isNone(components.auth.pages.roles)) {
    components.auth.pages.roles = {};
  }
  if (type.isNone(components.auth.callbacks)) {
    components.auth.callbacks = [];
  }
  if (type.isNone(components.auth.events)) {
    components.auth.events = [];
  }
  if (type.isNone(components.auth.providers)) {
    components.auth.providers = [];
  }
  if (type.isNone(components.auth.session)) {
    components.auth.session = {};
  }
  if (type.isNone(components.auth.theme)) {
    components.auth.theme = {};
  }

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

  validateMutualExclusivity({ components, context, entity: 'api' });
  validateMutualExclusivity({ components, context, entity: 'pages' });

  // Validate NEXTAUTH_SECRET is set when auth providers are configured
  if (components.auth.providers.length > 0 && type.isNone(process.env.NEXTAUTH_SECRET)) {
    throw new ConfigError(
      'Auth providers are configured but NEXTAUTH_SECRET environment variable is not set. ' +
        'Set NEXTAUTH_SECRET to a secure random string (e.g., generate with `openssl rand -base64 32`).',
      { configKey: components.auth.providers['~k'] ?? components.auth['~k'] }
    );
  }

  return components;
}

export default validateAuthConfig;
