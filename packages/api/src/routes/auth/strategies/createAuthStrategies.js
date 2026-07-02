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

import { ServerParser } from '@lowdefy/operators';
import { _app, _secret } from '@lowdefy/operators-js/operators/server';
import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

// Builds the API auth strategy verifiers from the auth.json build artifact.
// Build has validated the config and written all defaults, so this resolves
// the _secret operators and constructs each strategy type's verifier.
// Verifier factories warn on short static keys at construction, so key
// strength surfaces at startup, never as a build failure.
function createAuthStrategies({ appMeta, authJson, logger, plugins, secrets }) {
  if (!type.isArray(authJson.strategies) || authJson.strategies.length === 0) {
    return [];
  }

  const operatorsParser = new ServerParser({
    lowdefyApp: appMeta,
    operators: { _app, _secret },
    secrets,
    user: {},
  });

  const { output: strategiesConfig, errors: operatorErrors } = operatorsParser.parse({
    input: authJson.strategies,
    location: 'auth.strategies',
    payload: {},
  });

  if (operatorErrors.length > 0) {
    throw operatorErrors[0];
  }

  return strategiesConfig.map((strategy) => {
    const strategyPlugin = plugins.strategies[strategy.type];
    if (type.isNone(strategyPlugin)) {
      throw new ConfigError(
        `Auth strategy type "${strategy.type}" not found at strategy "${strategy.id}".`,
        { configKey: strategy['~k'] }
      );
    }
    let verify;
    try {
      verify = strategyPlugin({
        logger,
        properties: strategy.properties,
        strategyId: strategy.id,
      });
    } catch (error) {
      throw new ConfigError(error.message, { cause: error, configKey: strategy['~k'] });
    }
    return {
      attributes: strategy.attributes,
      id: strategy.id,
      roles: strategy.roles,
      type: strategy.type,
      verify,
    };
  });
}

export default createAuthStrategies;
