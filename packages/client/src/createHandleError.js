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

import { getDevError } from '@lowdefy/engine';
import { serializer } from '@lowdefy/helpers';

function createHandleError(lowdefy) {
  const loggedErrors = new Set();
  const logger = lowdefy._internal.logger;

  function logError(error) {
    lowdefy._runtimeErrorCallback?.(error);
    logger.error(error);
  }

  return async function handleError(error) {
    // The dev tools show the dev server's full error; every decision below stays on
    // the error config sees. Keying on the shown message means two different dev
    // failures of one action both display, while prod's generic server message
    // still logs once per configKey.
    const devError = getDevError(error);
    const shown = devError ?? error;
    const errorKey = `${shown.message}:${error.configKey || ''}`;
    if (loggedErrors.has(errorKey)) {
      return;
    }
    loggedErrors.add(errorKey);

    // UserError is client-only — log to browser console, never send to server or
    // the error bar. Matched by name, not instanceof: plugins bundle their own
    // @lowdefy/errors copy.
    if (error?.name === 'UserError') {
      logger.error(shown);
      return;
    }

    // Send known error types to server for logging with location resolution
    if (error.isLowdefyError) {
      // The server already logged this one — just display locally. Keyed on
      // `handled`, not on `source`: a LowdefyInternalError is logged server-side
      // but never gets a source (location resolution is skipped for it), so
      // keying on source POSTed it back and had it logged twice.
      if (error.handled) {
        logError(shown);
        return;
      }
      // Client-originated errors — send to server for logging + location resolution
      try {
        const serialized = serializer.serialize(error);
        const response = await fetch(`${lowdefy?.basePath ?? ''}/api/client-error`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serialized),
          credentials: 'same-origin',
        });
        if (response.ok) {
          const { source: resolvedSource, configError: serializedConfigError } =
            await response.json();
          if (resolvedSource) {
            error.source = resolvedSource;
          }
          // If server produced a consolidated ConfigError, log it and return early
          // (cause chain includes original error)
          if (serializedConfigError) {
            logError(serializer.deserialize(serializedConfigError));
            return;
          }
        }
      } catch {
        // Server logging failed - continue with local console
      }
      logError(shown);
      return;
    }

    // Other errors - just log locally
    logError(shown);
  };
}

export default createHandleError;
