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

import { ConfigError } from '@lowdefy/errors';

import applyTenantToFilter from './applyTenantToFilter.js';
import applyTenantToUpdate from './applyTenantToUpdate.js';
import stampTenantOnDoc from './stampTenantOnDoc.js';

// bulkWrite is every write shape in one request - each operation is handled
// per its kind: insert documents and replacements stamped, update and delete
// filters merged, update documents guarded. An operation kind this map does
// not know is rejected - fail closed, never pass through unwalled.
function applyTenantToBulkOperations({ operations, tenant }) {
  return operations.map((operation) => {
    const [kind, op] = Object.entries(operation)[0] ?? [];
    switch (kind) {
      case 'insertOne':
        return {
          insertOne: {
            ...op,
            document: stampTenantOnDoc({ doc: op.document, tenant }),
          },
        };
      case 'replaceOne':
        return {
          replaceOne: {
            ...op,
            filter: applyTenantToFilter({ filter: op.filter, tenant, position: 'a filter' }),
            replacement: stampTenantOnDoc({
              doc: op.replacement,
              tenant,
              position: 'a replacement document',
            }),
          },
        };
      case 'updateOne':
      case 'updateMany':
        return {
          [kind]: {
            ...op,
            filter: applyTenantToFilter({ filter: op.filter, tenant, position: 'a filter' }),
            update: applyTenantToUpdate({
              update: op.update,
              tenant,
              upsert: op.upsert === true,
            }),
          },
        };
      case 'deleteOne':
      case 'deleteMany':
        return {
          [kind]: {
            ...op,
            filter: applyTenantToFilter({ filter: op.filter, tenant, position: 'a filter' }),
          },
        };
      default:
        throw new ConfigError(`Unsupported bulkWrite operation "${kind}" on a tenant connection.`);
    }
  });
}

export default applyTenantToBulkOperations;
