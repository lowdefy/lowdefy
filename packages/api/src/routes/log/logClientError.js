/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { resolveConfigLocation } from '@lowdefy/errors/build';
import { ConfigError, deserializeError } from '@lowdefy/errors/server';

import formatValidationError from './formatValidationError.js';
import validateBlockProperties from './validateBlockProperties.js';

async function logClientError(context, data) {
  const { logger } = context;

  // Deserialize the error from the client
  const error = deserializeError(data);

  // Validate block properties against schema if this is a block PluginError
  let errors = [error];
  if (error.name === 'PluginError' && error.pluginType === 'block' && error.blockType) {
    try {
      const blockSchemas = await context.readConfigFile('plugins/blockSchemas.json');
      const schema = blockSchemas?.[error.blockType];
      if (schema) {
        const validationErrors = validateBlockProperties({
          blockType: error.blockType,
          properties: error.properties,
          schema,
        });

        if (validationErrors) {
          errors = validationErrors.map(
            (validationError) =>
              new ConfigError({
                message: formatValidationError(validationError, error.blockType, error.properties),
                configKey: error.configKey,
              })
          );
        }
      }
    } catch (err) {
      logger.warn({ event: 'warn_block_schema_load_failed', error: err.message });
    }
  }

  // Resolve config location for errors with configKey
  const configKey = errors[0].configKey;
  if (configKey) {
    try {
      const [keyMap, refMap] = await Promise.all([
        context.readConfigFile('keyMap.json'),
        context.readConfigFile('refMap.json'),
      ]);

      const location = resolveConfigLocation({
        configKey,
        keyMap,
        refMap,
        configDirectory: context.configDirectory,
      });

      if (location) {
        for (const err of errors) {
          err.source = location.source;
          err.config = location.config;
          err.link = location.link;
        }
      }
    } catch (err) {
      logger.warn({ event: 'warn_maps_load_failed', error: err.message });
    }
  }

  // Log errors - logger handles formatting
  for (const err of errors) {
    logger.error(err);
  }

  return {
    success: true,
    source: errors[0].source ?? null,
    config: errors[0].config ?? null,
    link: errors[0].link ?? null,
    errors: errors.map((err) => (err.serialize ? err.serialize() : null)).filter(Boolean),
  };
}

export default logClientError;
