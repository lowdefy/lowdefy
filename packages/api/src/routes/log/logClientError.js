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
import validatePluginSchema from './validatePluginSchema.js';

const validationConfigs = [
  {
    pluginType: 'block',
    guard: (error) => error.blockType,
    schemaFile: 'plugins/blockSchemas.json',
    schemaLookup: (error) => error.blockType,
    schemaKey: 'properties',
    pluginLabel: 'Block',
    fieldLabel: 'property',
    pluginName: (error) => error.blockType,
    data: (error) => error.properties,
    warnEvent: 'warn_block_schema_load_failed',
  },
  {
    pluginType: 'action',
    guard: (error) => error.pluginName,
    schemaFile: 'plugins/actionSchemas.json',
    schemaLookup: (error) => error.pluginName,
    schemaKey: 'params',
    pluginLabel: 'Action',
    fieldLabel: 'param',
    pluginName: (error) => error.pluginName,
    data: (error) => error.received,
    warnEvent: 'warn_action_schema_load_failed',
  },
  {
    pluginType: 'operator',
    guard: (error) => error.pluginName,
    schemaFile: 'plugins/operatorSchemas.json',
    schemaLookup: (error) => error.pluginName,
    schemaKey: 'params',
    pluginLabel: 'Operator',
    fieldLabel: 'param',
    pluginName: (error) => error.pluginName,
    data: (error) => {
      // received is { _if: params } — extract just the params value
      if (!error.received) return null;
      const values = Object.values(error.received);
      return values.length > 0 ? values[0] : null;
    },
    warnEvent: 'warn_operator_schema_load_failed',
  },
];

async function logClientError(context, data) {
  const { logger } = context;

  // Deserialize the error from the client
  const error = deserializeError(data);

  // Validate plugin data against schema if this is a PluginError
  let errors = [error];
  if (error.name === 'PluginError') {
    for (const config of validationConfigs) {
      if (error.pluginType !== config.pluginType || !config.guard(error)) continue;

      try {
        const schemas = await context.readConfigFile(config.schemaFile);
        const schema = schemas?.[config.schemaLookup(error)];
        if (schema) {
          const validationErrors = validatePluginSchema({
            data: config.data(error),
            schema,
            schemaKey: config.schemaKey,
          });

          if (validationErrors) {
            errors = validationErrors.map(
              (validationError) =>
                new ConfigError({
                  message: formatValidationError({
                    err: validationError,
                    pluginLabel: config.pluginLabel,
                    pluginName: config.pluginName(error),
                    fieldLabel: config.fieldLabel,
                    data: config.data(error),
                  }),
                  configKey: error.configKey,
                })
            );
          }
        }
      } catch (err) {
        logger.warn({ event: config.warnEvent, error: err.message });
      }
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
