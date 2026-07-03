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

import { ObjectId, UUID } from 'mongodb';

// Coerces string id values in where clauses to the BSON id type used in the
// database (ObjectId, or UUID when generateId is 'uuid'), so lookups match
// documents whose _id was created by the driver. Strings that are not valid
// ids pass through unchanged - a custom generateId function stores plain
// strings, so coercion is skipped entirely in that case.
function createSerializeId({ customIdGenerator, getDefaultModelName, schema, useUUIDs }) {
  function coerceToIdType(value) {
    if (useUUIDs) {
      return new UUID(value);
    }
    return new ObjectId(value);
  }

  function isIdInstance(value) {
    if (useUUIDs) {
      return value instanceof UUID;
    }
    return value instanceof ObjectId;
  }

  return function serializeId({ field, model, value }) {
    if (customIdGenerator) {
      return value;
    }
    const modelName = getDefaultModelName(model);
    const isIdField =
      field === 'id' ||
      field === '_id' ||
      schema[modelName].fields[field]?.references?.field === 'id';
    if (!isIdField) {
      return value;
    }
    if (value === null || value === undefined) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return coerceToIdType(value);
      } catch {
        return value;
      }
    }
    if (isIdInstance(value)) {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (item === null || item === undefined) {
          return item;
        }
        if (typeof item === 'string') {
          try {
            return coerceToIdType(item);
          } catch {
            return item;
          }
        }
        if (isIdInstance(item)) {
          return item;
        }
        throw new Error(
          `MongoDB auth adapter received an invalid id value. Received ${JSON.stringify(item)}.`
        );
      });
    }
    throw new Error(
      `MongoDB auth adapter received an invalid id value. Received ${JSON.stringify(value)}.`
    );
  };
}

export default createSerializeId;
