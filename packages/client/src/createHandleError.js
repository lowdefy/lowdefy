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

import { UserError } from '@lowdefy/errors';
import { serializer } from '@lowdefy/helpers';

function createHandleError(lowdefy) {
  const loggedErrors = new Set();
  const logger = lowdefy._internal.logger;

  return async function handleError(error) {
    const errorKey = `${error.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) {
      return;
    }
    loggedErrors.add(errorKey);

    // UserError is client-only — log to browser console, never send to server
    if (error instanceof UserError) {
      logger.error(error);
      return;
    }

    // Send known error types to server for logging with location resolution
    if (error.isLowdefyError) {
      try {
        const serialized = serializer.serialize(error);
        if (serialized?.['~e']) {
          delete serialized['~e'].received;
        }
        const response = await fetch(`${lowdefy?.basePath ?? ''}/api/client-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serialized),
          credentials: 'same-origin',
        });
        if (response.ok) {
          const { source: resolvedSource } = await response.json();
          if (resolvedSource) {
            error.source = resolvedSource;
          }
        }
      } catch {
        // Server logging failed - continue with local console
      }
      logger.error(error);
      return;
    }

    // Other errors - just log locally
    logger.error(error);
  };
}

export default createHandleError;
