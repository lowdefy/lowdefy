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

import collectEnvironmentGuards from '../utils/collectEnvironmentGuards.js';

// Guard shape and patterns are validated for every environment, not only the current one, so a
// broken guard fails the build that introduces it.
function validateEnvironmentGuards({ name, guards, configKey }) {
  if (type.isUndefined(guards)) return;
  const where = `config.environments.${name}.guards`;
  if (!type.isObject(guards)) {
    throw new ConfigError(`App "${where}" should be an object.`, { received: guards, configKey });
  }
  ['secrets', 'env'].forEach((kind) => {
    const map = guards[kind];
    if (type.isUndefined(map)) return;
    if (!type.isObject(map)) {
      throw new ConfigError(`App "${where}.${kind}" should be an object.`, {
        received: map,
        configKey,
      });
    }
  });
  collectEnvironmentGuards({ guards }).forEach(({ label, pattern }) => {
    if (!type.isString(pattern) || pattern === '') {
      throw new ConfigError(`App "${where}" ${label} should be a regular expression string.`, {
        received: pattern,
        configKey,
      });
    }
    try {
      new RegExp(pattern);
    } catch (error) {
      throw new ConfigError(
        `App "${where}" ${label} is not a valid regular expression: ${error.message}`,
        { configKey }
      );
    }
  });
}

export default validateEnvironmentGuards;
