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

import { ConfigError, loadAndResolveErrorLocation } from '@lowdefy/errors';
import { serializer, type } from '@lowdefy/helpers';

import formatValidationError from './formatValidationError.js';
import validatePluginSchema from './validatePluginSchema.js';

const validationConfigs = {
  BlockError: {
    schemaFile: 'plugins/blockSchemas.json',
    schemaKey: 'properties',
    pluginLabel: 'Block',
    fieldLabel: 'property',
  },
  ActionError: {
    schemaFile: 'plugins/actionSchemas.json',
    schemaKey: 'params',
    pluginLabel: 'Action',
    fieldLabel: 'param',
  },
  OperatorError: {
    schemaFile: 'plugins/operatorSchemas.json',
    schemaKey: 'params',
    pluginLabel: 'Operator',
    fieldLabel: 'param',
  },
};

async function logClientError(context, serializedError) {
  const { logger } = context;
  const error = serializer.deserialize(serializedError);

  // Schema validation for plugin errors with received data
  const validationConfig = validationConfigs[error.name];
  let validationErrors = null;

  if (validationConfig && !type.isNone(error.received)) {
    const schemas = await context.readConfigFile(validationConfig.schemaFile);
    if (schemas) {
      const schema = schemas[error.typeName];
      if (schema) {
        try {
          const data =
            error.name === 'OperatorError' ? Object.values(error.received)[0] : error.received;

          const ajvErrors = validatePluginSchema({
            data,
            schema,
            schemaKey: validationConfig.schemaKey,
          });

          if (ajvErrors) {
            const displayName =
              error.name === 'OperatorError' && error.methodName
                ? `${error.typeName}.${error.methodName}`
                : error.typeName;

            validationErrors = ajvErrors.map(
              (ajvError) =>
                new ConfigError(
                  formatValidationError({
                    ajvError,
                    pluginLabel: validationConfig.pluginLabel,
                    typeName: displayName,
                    fieldLabel: validationConfig.fieldLabel,
                  }),
                  { configKey: error.configKey }
                )
            );
          }
        } catch (e) {
          logger.warn(e);
        }
      }
    }
  }

  const location = await loadAndResolveErrorLocation({
    error,
    readConfigFile: context.readConfigFile,
    configDirectory: context.configDirectory,
  });

  if (location) {
    error.source = location.source;
    error.config = location.config;
  }

  logger.error(error);

  // If validation produced ConfigErrors, resolve their locations and log them
  if (validationErrors) {
    for (const configError of validationErrors) {
      if (location) {
        configError.source = location.source;
        configError.config = location.config;
      }
      logger.error(configError);
    }

    return {
      success: true,
      source: error.source ?? null,
      config: error.config ?? null,
      error,
      errors: validationErrors.map((e) => serializer.serialize(e)),
    };
  }

  return {
    success: true,
    source: error.source ?? null,
    config: error.config ?? null,
    error,
  };
}

export default logClientError;
