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

import path from 'node:path';

import { LowdefyInternalError, loadAndResolveErrorLocation } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import serverErrorStore from '../../docs/serverErrorStore.js';

// A UserError is an expected outcome of user interaction (a rejected payload,
// a :reject) and a LowdefyInternalError never carries a config location, so
// neither belongs in the agent's feedback channel.
function shouldStore(error) {
  if (error instanceof LowdefyInternalError) {
    return false;
  }
  return error.name !== 'UserError';
}

// A _js error resolves `source` to the YAML node holding the operator, so the
// file:line inside the author's own JS is nowhere on the wire - omitErrorProps
// strips the stack. serverErrorStore is a dev-only in-process channel, so keep
// the first frame that names a file the author wrote and an agent can open.
function firstAppStackFrame({ error, configDirectory }) {
  if (!type.isString(error.stack) || !type.isString(configDirectory)) {
    return null;
  }
  for (const line of error.stack.split('\n').slice(1)) {
    const match = line.match(/\(?(?:file:\/\/)?(\/[^\s)]+):(\d+):\d+\)?$/);
    if (match === null) continue;
    const filePath = match[1];
    if (filePath.includes('node_modules') || !filePath.startsWith(configDirectory)) continue;
    return `${path.relative(configDirectory, filePath)}:${match[2]}`;
  }
  return null;
}

function createHandleError({ context }) {
  return async function handleError(error) {
    try {
      // Set first, not after the log call: this function is the server's error
      // sink, so reaching it is what makes the error already-logged, and the catch
      // below guarantees something is written even when the steps here fail. The
      // client reads `handled` to decide whether to POST the error to
      // /api/client-error, so a later throw skipping this assignment would have it
      // logged a second time. Not keyed on `source`, which a LowdefyInternalError
      // never gets - location resolution is skipped for it below.
      error.handled = true;

      // For internal lowdefy errors, don't resolve config location
      const location =
        error instanceof LowdefyInternalError
          ? null
          : await loadAndResolveErrorLocation({
              error,
              readConfigFile: context.readConfigFile,
              configDirectory: context.configDirectory,
            });

      // Attach resolved location to error for display layer
      if (location) {
        error.source = location.source;
        error.config = location.config;
      }

      if (shouldStore(error)) {
        serverErrorStore.push({
          timestamp: new Date().toISOString(),
          name: error.name,
          message: error.message,
          source: error.source ?? null,
          config: error.config ?? null,
          hint: error.hint ?? null,
          endpointId: context.endpointId ?? null,
          requestId: context.requestId ?? null,
          pageId: context.pageId ?? null,
          stackFrame: firstAppStackFrame({ error, configDirectory: context.configDirectory }),
        });
      }

      context.logger.error(error);
    } catch (e) {
      console.error(error);
      console.error('An error occurred while logging the error.');
      console.error(e);
    }
  };
}

export default createHandleError;
