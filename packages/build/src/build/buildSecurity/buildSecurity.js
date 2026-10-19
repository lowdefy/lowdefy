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
import { type } from '@lowdefy/helpers';

import buildContentSecurityPolicy from './buildContentSecurityPolicy.js';

// Resolves config.security into the server's security artifact (build/security.json).
// Every key is always set (null when off), so the server reads it without defaults. Kept
// on context, like the dynamic policies, since it is build output rather than config.
function buildSecurity({ components, context }) {
  const { security } = components.config;
  if (!type.isUndefined(security) && !type.isObject(security)) {
    throw new ConfigError('App "config.security" should be an object.', {
      received: security,
      configKey: components.config['~k'],
    });
  }
  context.security = {
    contentSecurityPolicy: buildContentSecurityPolicy({
      contentSecurityPolicy: security?.contentSecurityPolicy,
      hasWebsockets: type.isArray(components.websockets) && components.websockets.length > 0,
      configKey: security?.['~k'] ?? components.config['~k'],
    }),
  };
  return components;
}

export default buildSecurity;
