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

const strategyTypes = ['apiKey', 'jwt'];

function setDefault(object, key, value) {
  if (type.isNone(object[key])) {
    object[key] = value;
  }
}

function validateApiKeyStrategy({ strategy, configKey }) {
  const properties = strategy.properties ?? {};
  if (!type.isArray(properties.keys) || properties.keys.length === 0) {
    throw new ConfigError(
      `Auth strategy "${strategy.id}" requires "properties.keys" to be a non-empty array of keys.`,
      { configKey }
    );
  }
  properties.keys.forEach((key, index) => {
    if (type.isNone(key.value)) {
      throw new ConfigError(
        `Auth strategy "${strategy.id}" key at index ${index} is missing "value". Reference the key with the _secret operator.`,
        { configKey }
      );
    }
  });
}

function validateJwtStrategy({ strategy, configKey }) {
  const properties = strategy.properties ?? {};
  const hasSecret = !type.isNone(properties.secret);
  const hasJwksUri = !type.isNone(properties.jwksUri);
  if (hasSecret === hasJwksUri) {
    throw new ConfigError(
      `Auth strategy "${strategy.id}" requires exactly one of "properties.secret" or "properties.jwksUri" to verify token signatures.`,
      { configKey }
    );
  }
  // The algorithms allowlist restricts which signing algorithms are accepted,
  // preventing "alg: none" and algorithm-confusion downgrade attacks.
  if (!type.isArray(properties.algorithms) || properties.algorithms.length === 0) {
    throw new ConfigError(
      `Auth strategy "${strategy.id}" requires "properties.algorithms" to be a non-empty array restricting the accepted signing algorithms.`,
      { configKey }
    );
  }
}

// Validates auth.strategies and writes per-entry defaults so the runtime
// never falls back. Objects are mutated in place to preserve ~k markers.
function buildAuthStrategies({ components }) {
  const seenIds = {};
  (components.auth.strategies ?? []).forEach((strategy) => {
    const configKey = strategy['~k'];
    if (seenIds[strategy.id] === true) {
      throw new ConfigError(`Duplicate auth strategy id "${strategy.id}".`, { configKey });
    }
    seenIds[strategy.id] = true;

    if (!strategyTypes.includes(strategy.type)) {
      throw new ConfigError(
        `Auth strategy "${strategy.id}" has unknown type "${
          strategy.type
        }". Valid types are: ${strategyTypes.join(', ')}.`,
        { received: strategy.type, configKey }
      );
    }

    if (strategy.type === 'apiKey') {
      validateApiKeyStrategy({ strategy, configKey });
    }
    if (strategy.type === 'jwt') {
      validateJwtStrategy({ strategy, configKey });
    }

    setDefault(strategy, 'roles', []);
    setDefault(strategy, 'attributes', {});
    if (strategy.type === 'apiKey') {
      setDefault(strategy.properties, 'headerName', 'X-API-Key');
    }
  });
  return components;
}

export default buildAuthStrategies;
