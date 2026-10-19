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

import fieldTypes from './fieldTypes.js';

// A Map, not an object: a view key such as "__proto__" or "constructor" must never
// resolve to an allowlist entry.
function normalizeFields({ fields }) {
  const fieldsByKey = new Map();
  Object.entries(fields).forEach(([key, field]) => {
    const fieldType = fieldTypes[field.type];
    if (type.isUndefined(fieldType)) {
      throw new Error(
        `MongoDBTableQuery field "${key}" has unknown type ${JSON.stringify(field.type)}.`
      );
    }
    const path = field.path ?? key;
    if (path.split('.').some((segment) => segment === '' || segment.startsWith('$'))) {
      throw new Error(
        `MongoDBTableQuery field "${key}" has an invalid path. Received ${JSON.stringify(path)}.`
      );
    }
    fieldsByKey.set(key, {
      key,
      type: field.type,
      family: fieldType.family,
      operators: fieldType.operators,
      aggregates: fieldType.aggregates,
      path,
      search: field.search === true,
      sortable: field.sortable !== false,
      filterable: field.filterable !== false,
      groupable: field.groupable === true,
    });
  });
  return fieldsByKey;
}

export default normalizeFields;
