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

import { resolveErrorConfigLocation } from '@lowdefy/errors/build';

import captureSentryError from '../sentry/captureSentryError.js';

async function logError({ context, error }) {
  try {
    const message = error?.message || 'Unknown error';
    const isServiceError = error?.isServiceError === true;

    // For service errors, don't resolve config location (not a config issue)
    const location = isServiceError
      ? null
      : await resolveErrorConfigLocation({
          error,
          readConfigFile: context.readConfigFile,
          configDirectory: context.configDirectory,
        });

    // Human-readable output: source (info/blue) then message (error/red)
    if (location) {
      context.logger.info(location.source);
    }
    context.logger.error(message);

    // Structured logging for log aggregation (debug level - won't display in dev)
    context.logger.debug({
      event: isServiceError ? 'service_error' : 'config_error',
      errorName: error?.name || 'Error',
      errorMessage: message,
      isServiceError,
      pageId: context.pageId || null,
      timestamp: new Date().toISOString(),
      source: location?.source || null,
      config: location?.config || null,
      link: location?.link || null,
    });

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
