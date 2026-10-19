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
import { type } from '@lowdefy/helpers';

import coerceFieldValue from './coerceFieldValue.js';
import coerceRowKey from './coerceRowKey.js';
import getChangeField from './getChangeField.js';
import getRowPatch from './getRowPatch.js';

// `updated` is { [rowKey]: { [field]: value } }, the field being the column's dot path. Each
// field must be in the allowlist and each value of its type; it is written at the field's path.
function parseUpdatedRows({ updated, fieldsByKey, rowKeyType, rows }) {
  Object.entries(updated).forEach(([rawKey, values]) => {
    const location = `updated row ${JSON.stringify(rawKey)}`;
    if (!type.isObject(values)) {
      throw new Error(
        `MongoDBTableChanges ${location} should be an object of changed fields. Received ${JSON.stringify(
          values
        )}.`
      );
    }
    const entries = Object.entries(values);
    if (entries.length === 0) return;
    const key = coerceRowKey({ value: rawKey, rowKeyType, part: 'updated' });
    const patch = getRowPatch({ rows, key });
    entries.forEach(([fieldKey, value]) => {
      const field = getChangeField({ fieldsByKey, key: fieldKey, location });
      patch.set(field.path, coerceFieldValue({ field, value, location }));
    });
  });
}

export default parseUpdatedRows;
