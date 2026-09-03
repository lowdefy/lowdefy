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

import validateDocFields from './validateDocFields.js';
import validateUpdateFields from './validateUpdateFields.js';

// bulkWrite is every write shape in one request - each operation is checked
// per its kind, as applyTenantToBulkOperations stamps and merges per kind:
// insert documents and replacements as documents, updates as updates.
// Deletes carry no shape; an unknown kind is the driver's to refuse.
function validateBulkOperationFields({ operations, collectionSchema }) {
  operations.forEach((operation, index) => {
    const [kind, op] = Object.entries(operation)[0] ?? [];
    switch (kind) {
      case 'insertOne':
        validateDocFields({
          doc: op.document,
          collectionSchema,
          position: `an insert document (operations[${index}])`,
        });
        return;
      case 'replaceOne':
        validateDocFields({
          doc: op.replacement,
          collectionSchema,
          position: `a replacement document (operations[${index}])`,
        });
        return;
      case 'updateOne':
      case 'updateMany':
        validateUpdateFields({
          update: op.update,
          collectionSchema,
          filter: op.filter,
          options: op,
          position: `an update (operations[${index}])`,
        });
        return;
      default:
        return;
    }
  });
}

export default validateBulkOperationFields;
