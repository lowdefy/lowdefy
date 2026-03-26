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
import { ConfigError } from '@lowdefy/errors';
import buildAgentAuth from './buildAgentAuth.js';
import buildAuthPlugins from './buildAuthPlugins.js';
import buildApiAuth from './buildApiAuth.js';
import buildPageAuth from './buildPageAuth.js';
import validateAuthConfig from './validateAuthConfig.js';

function hasAgentAuthEntries({ components }) {
  const agents = components.auth.agents;
  if (agents.protected === true || type.isArray(agents.protected)) return true;
  if (agents.public === true || type.isArray(agents.public)) return true;
  if (Object.keys(agents.roles).length > 0) return true;
  return false;
}

function buildAuth({ components, context }) {
  const configured = !type.isNone(components.auth);
  validateAuthConfig({ components, context });
  components.auth.configured = configured;
  buildAgentAuth({ components, context });
  buildApiAuth({ components, context });
  buildPageAuth({ components, context });
  buildAuthPlugins({ components, context });

  // Validate JWT secret is configured when auth.agents has entries
  if (hasAgentAuthEntries({ components }) && type.isNone(components.auth.jwt.secret)) {
    throw new ConfigError(
      'auth.agents is configured but auth.jwt.secret is not set. ' +
        'Set auth.jwt.secret to a secure random string for signing external API tokens.',
      { configKey: components.auth.agents['~k'] ?? components.auth['~k'] }
    );
  }

  return components;
}

export default buildAuth;
