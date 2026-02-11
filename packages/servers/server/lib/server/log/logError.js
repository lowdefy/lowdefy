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

import {
  ConfigError,
  LowdefyError,
  PluginError,
  ServiceError,
} from '@lowdefy/errors/server';
import { resolveErrorConfigLocation } from '@lowdefy/errors/build';
import { formatValidationError, validatePluginSchema } from '@lowdefy/api';

import captureSentryError from '../sentry/captureSentryError.js';

function getEventType(error) {
  if (error instanceof ServiceError || error?.isServiceError === true) {
    return 'service_error';
  }
  if (error instanceof PluginError) {
    return 'plugin_error';
  }
  if (error instanceof ConfigError) {
    return 'config_error';
  }
  if (error instanceof LowdefyError) {
    return 'lowdefy_error';
  }
  return 'error';
}

async function logError({ context, error }) {
  try {
    const { headers = {}, user = {} } = context;
    const isServiceError = error instanceof ServiceError || error?.isServiceError === true;
    const isLowdefyError = error instanceof LowdefyError;

    // For service errors and internal lowdefy errors, don't resolve config location
    const location =
      isServiceError || isLowdefyError
        ? null
        : await resolveErrorConfigLocation({
            error,
            readConfigFile: context.readConfigFile,
            configDirectory: context.configDirectory,
          });

    // Attach resolved location to error for consistency
    if (location) {
      error.source = location.source;
      error.config = location.config;
    }

    // Validate operator schema if this is an operator PluginError
    if (
      error instanceof PluginError &&
      error.pluginType === 'operator' &&
      error.pluginName
    ) {
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

    // LowdefyError gets special handling (includes stack trace)
    if (isLowdefyError) {
      context.logger.error(error);
    }

    // Structured logging (consistent with client error schema + production fields)
    const eventType = getEventType(error);
    const errorName = error?.name || 'Error';
    context.logger.error(
      {
        // Core error schema (consistent with client)
        event: eventType,
        errorName,
        errorMessage: error.message,
        isServiceError,
        pageId: context.pageId || null,
        timestamp: new Date().toISOString(),
        source: error.source || null,
        config: error.config || null,
        link: location?.link || null,
        // Production fields
        user: {
          id: user.id,
          roles: user.roles,
          sub: user.sub,
          session_id: user.session_id,
        },
        url: context.req.url,
        method: context.req.method,
        resolvedUrl: context.nextContext?.resolvedUrl,
        hostname: context.req.hostname,
        headers: {
          'accept-language': headers['accept-language'],
          'sec-ch-ua-mobile': headers['sec-ch-ua-mobile'],
          'sec-ch-ua-platform': headers['sec-ch-ua-platform'],
          'sec-ch-ua': headers['sec-ch-ua'],
          'user-agent': headers['user-agent'],
          host: headers.host,
          referer: headers.referer,
          // Non localhost headers
          'x-forward-for': headers['x-forward-for'],
          // Vercel headers
          'x-vercel-id': headers['x-vercel-id'],
          'x-real-ip': headers['x-real-ip'],
          'x-vercel-ip-country': headers['x-vercel-ip-country'],
          'x-vercel-ip-country-region': headers['x-vercel-ip-country-region'],
          'x-vercel-ip-city': headers['x-vercel-ip-city'],
          'x-vercel-ip-latitude': headers['x-vercel-ip-latitude'],
          'x-vercel-ip-longitude': headers['x-vercel-ip-longitude'],
          'x-vercel-ip-timezone': headers['x-vercel-ip-timezone'],
          // Cloudflare headers
          'cf-connecting-ip': headers['cf-connecting-ip'],
          'cf-ray': headers['cf-ray'],
          'cf-ipcountry': headers['cf-ipcountry'],
          'cf-visitor': headers['cf-visitor'],
        },
      },
      error.print ? error.print() : `[${errorName}] ${error.message}`
    );

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
