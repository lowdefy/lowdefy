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

import applyTenantToBulkOperations from '../tenant/applyTenantToBulkOperations.js';
import { assertUnscopedBulkOperations } from '../tenant/guardUnscopedWrite.js';

// Write operations with the tenant wall merged into every filter on a tenant connection, and
// checked by the unscoped write guard on a tenant: none request or a walled shared connection.
function scopeWriteOperations({ operations, tenant, tenantGuard }) {
  let scoped = operations;
  if (tenant) {
    scoped = applyTenantToBulkOperations({ operations: scoped, tenant });
  }
  if (tenantGuard) {
    assertUnscopedBulkOperations({ operations: scoped, field: tenantGuard.field });
  }
  return scoped;
}

export default scopeWriteOperations;
