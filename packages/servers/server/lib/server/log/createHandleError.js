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

import {
  ActionError,
  BlockError,
  ConfigError,
  LowdefyInternalError,
  OperatorError,
  PluginError,
  RequestError,
  loadAndResolveErrorLocation,
  ServiceError,
} from '@lowdefy/errors';

import captureSentryError from '../sentry/captureSentryError.js';

function getEventType(error) {
  if (error instanceof ServiceError) {
    return 'service_error';
  }
  if (error instanceof OperatorError) {
    return 'operator_error';
  }
  if (error instanceof ActionError) {
    return 'action_error';
  }
  if (error instanceof RequestError) {
    return 'request_error';
  }
  if (error instanceof BlockError) {
    return 'block_error';
  }
  if (error instanceof PluginError) {
    return 'plugin_error';
  }
  if (error instanceof ConfigError) {
    return 'config_error';
  }
  if (error instanceof LowdefyInternalError) {
    return 'lowdefy_error';
  }
  return 'error';
}

function createHandleError({ context }) {
  return async function handleError(error) {
    try {
      const { headers = {}, user = {} } = context;
      const eventType = getEventType(error);
      const isServiceError = error instanceof ServiceError;
      const isLowdefyInternalError = error instanceof LowdefyInternalError;

      // For internal lowdefy errors, don't resolve config location
      const location = isLowdefyInternalError
        ? null
        : await loadAndResolveErrorLocation({
            error,
            readConfigFile: context.readConfigFile,
            configDirectory: context.configDirectory,
          });

      // Attach resolved location to error for consistency
      if (location) {
        error.source = location.source;
        error.config = location.config;
      }

      // Single structured log call — pino serializes error via extractErrorProps,
      // message string gives human-readable display via CLI logger
      const errorName = error?.name || 'Error';
      context.logger.error(
        {
          err: error,
          // Top-level fields for log drain consumers (duplicated from err for queryability)
          event: eventType,
          errorName,
          errorMessage: error.message,
          isServiceError,
          pageId: context.pageId || null,
          timestamp: new Date().toISOString(),
          source: error.source || null,
          config: error.config || null,
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
        error.message
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
  };
}

export default createHandleError;
