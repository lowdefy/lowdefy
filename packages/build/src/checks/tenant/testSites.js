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
import testContext from '../../test-utils/testContext.js';

// A tenant-policy build context with one walled connection ("controls_db",
// default field), one walled connection with a custom field ("tenants_db",
// field tenant_id) and one shared connection ("catalogue_db"), plus helpers
// that shape a page request or a routine step the way the build leaves them
// when runChecks runs.
function createTenantContext() {
  const context = testContext();
  context.errors = [];
  context.warnings = [];
  context.handleWarning = (warning) => context.warnings.push(warning);
  context.tenantConnections = new Map([
    ['controls_db', { type: 'MongoDBCollection', field: 'organization_id' }],
    ['tenants_db', { type: 'MongoDBCollection', field: 'tenant_id' }],
  ]);
  return context;
}

function pageRequest({ id = 'get_controls', connectionId = 'controls_db', ...request }) {
  return {
    pages: [
      {
        pageId: 'controls',
        requests: [
          {
            id: `request:controls:${id}`,
            requestId: id,
            connectionId,
            '~k': `k_${id}`,
            ...request,
          },
        ],
      },
    ],
  };
}

function endpointStep({ id = 'read_all_controls', connectionId = 'controls_db', ...step }) {
  return {
    api: [
      {
        endpointId: 'nightly_sync',
        routine: [
          {
            ':if': { _payload: 'sync' },
            ':then': [
              {
                id: `request:nightly_sync:${id}`,
                stepId: id,
                connectionId,
                '~k': `k_${id}`,
                ...step,
              },
            ],
          },
        ],
      },
    ],
  };
}

// Spreading two page or two endpoint fixtures would let the second overwrite
// the first; merge keeps every site.
function mergeComponents(...list) {
  return {
    pages: list.flatMap((components) => components.pages ?? []),
    api: list.flatMap((components) => components.api ?? []),
  };
}

export { createTenantContext, pageRequest, endpointStep, mergeComponents };
