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

import { LowdefyError } from '@lowdefy/errors';
import { resolveErrorConfigLocation } from '@lowdefy/errors/build';

import captureSentryError from '../sentry/captureSentryError.js';

function createHandleError({ context }) {
  return async function handleError(error) {
    try {
      const isServiceError = error?.isServiceError === true;
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

      // Attach resolved location to error for display layer
      if (location) {
        error.source = location.source;
        error.config = location.config;
      }

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
  };
}

export default createHandleError;
