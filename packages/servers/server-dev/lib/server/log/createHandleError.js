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

import { LowdefyInternalError, loadAndResolveErrorLocation } from '@lowdefy/errors';

function createHandleError({ context }) {
  return async function handleError(error) {
    try {
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

      context.logger.error(error);

      try {
        const user = context.user ?? {};
        context.audit?.log({
          category: 'error',
          eventType: `error.${error?.name ?? 'Error'}`,
          severity: 'high',
          initiator: {
            userId: user.id ?? user.sub,
            sub: user.sub,
            roles: user.roles,
          },
          target: {
            type: context.endpointId ? 'endpoint' : 'request',
            id: context.req?.url,
            pageId: context.pageId,
          },
          action: 'error',
          outcome: 'failure',
          metadata: {
            errorName: error?.name,
            errorMessage: error?.message,
            source: error?.source,
            configKey: error?.configKey,
          },
        });
      } catch (auditErr) {
        console.error('Audit error logging failed:', auditErr);
      }
    } catch (e) {
      console.error(error);
      console.error('An error occurred while logging the error.');
      console.error(e);
    }
  };
}

export default createHandleError;
