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

import { resolveConfigLocation } from '@lowdefy/node-utils';

import captureSentryError from '../sentry/captureSentryError.js';

async function resolveErrorConfigLocation(context, error) {
  if (!error.configKey) {
    return null;
  }
  try {
    const [keyMap, refMap] = await Promise.all([
      context.readConfigFile('keyMap.json'),
      context.readConfigFile('refMap.json'),
    ]);
    const location = resolveConfigLocation({
      configKey: error.configKey,
      keyMap,
      refMap,
      configDirectory: context.configDirectory,
    });
    return location || null;
  } catch {
    return null;
  }
}

async function logError({ context, error }) {
  try {
    const { headers = {}, user = {} } = context;
    const message = error?.message || 'Unknown error';
    const isServiceError = error?.isServiceError === true;

    // For service errors, don't resolve config location (not a config issue)
    const location = isServiceError ? null : await resolveErrorConfigLocation(context, error);

    // Human-readable console output (single log entry)
    const errorType = isServiceError ? 'Service Error' : 'Config Error';
    const source = location?.source ? `${location.source} at ${location.config}` : '';
    const link = location?.link || '';

    if (isServiceError || !location) {
      console.error(`[${errorType}] ${message}`);
    } else {
      console.error(`[${errorType}] ${message}\n  ${source}\n  ${link}`);
    }

    // Structured logging (consistent with client error schema + production fields)
    context.logger.error(
      {
        // Core error schema (consistent with client)
        event: isServiceError ? 'service_error' : 'config_error',
        errorName: error?.name || 'Error',
        errorMessage: message,
        isServiceError,
        pageId: context.pageId || null,
        timestamp: new Date().toISOString(),
        source: location?.source || null,
        config: location?.config || null,
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
      message
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
