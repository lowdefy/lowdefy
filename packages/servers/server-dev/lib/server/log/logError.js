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

import { ConfigError, PluginError } from '@lowdefy/errors/server';
import { resolveErrorConfigLocation } from '@lowdefy/errors/build';
import { formatValidationError, validatePluginSchema } from '@lowdefy/api';

import captureSentryError from '../sentry/captureSentryError.js';

async function logError({ context, error }) {
  try {
    const isServiceError = error?.isServiceError === true;

    // For service errors, don't resolve config location (not a config issue)
    const location = isServiceError
      ? null
      : await resolveErrorConfigLocation({
          error,
          readConfigFile: context.readConfigFile,
          configDirectory: context.configDirectory,
        });

    // Attach resolved location to error for display layer
    if (location) {
      error.source = location.source;
      error.config = location.config;
    }

    // Validate operator schema if this is an operator PluginError
    if (error instanceof PluginError && error.pluginType === 'operator' && error.pluginName) {
      try {
        const schemas = await context.readConfigFile('plugins/operatorSchemas.json');
        const schema = schemas?.[error.pluginName];
        if (schema) {
          // Extract params from received: { _if: params }
          const params = error.received ? Object.values(error.received)[0] : null;
          const validationErrors = validatePluginSchema({
            data: params,
            schema,
            schemaKey: 'params',
          });

          if (validationErrors) {
            for (const validationError of validationErrors) {
              const configError = new ConfigError({
                message: formatValidationError({
                  err: validationError,
                  pluginLabel: 'Operator',
                  pluginName: error.pluginName,
                  fieldLabel: 'param',
                  data: params,
                }),
                configKey: error.configKey,
              });
              if (location) {
                configError.source = location.source;
                configError.config = location.config;
              }
              context.logger.error(configError);
            }

            captureSentryError({
              error,
              context,
              configLocation: location,
            });
            return;
          }
        }
      } catch (err) {
        // Schema loading failed, continue with normal error logging
      }
    }

    // Log error - logger handles source, name prefix, and received formatting
    context.logger.error(error);

    // Capture error to Sentry (no-op if Sentry not configured)
    captureSentryError({
      error,
      context,
      configLocation: location,
    });
  } catch (e) {
    console.error(error);
    console.error('An error occurred while logging the error.');
    console.error(e);
  }
}

export default logError;
