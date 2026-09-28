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

import fieldTypes from '../MongoDBTableQuery/fieldTypes.js';
import isSafePath from './isSafePath.js';

// A Map, not an object: a changeset key such as "__proto__" or "constructor" must never
// resolve to an allowlist entry.
function normalizeChangeFields({ fields }) {
  if (!type.isObject(fields) || Object.keys(fields).length === 0) {
    throw new Error(
      `MongoDBTableChanges requires "fields", an object of the fields the changes may write. Received ${JSON.stringify(
        fields
      )}.`
    );
  }
  const fieldsByKey = new Map();
  const keyByPath = new Map();
  Object.entries(fields).forEach(([key, field]) => {
    if (!isSafePath(key)) {
      throw new Error(
        `MongoDBTableChanges field key ${JSON.stringify(
          key
        )} is not a valid dot path: segments can not be empty or start with "$".`
      );
    }
    const fieldType = fieldTypes[field?.type];
    if (type.isUndefined(fieldType)) {
      throw new Error(
        `MongoDBTableChanges field "${key}" has unknown type ${JSON.stringify(field?.type)}.`
      );
    }
    const path = field.path ?? key;
    if (!isSafePath(path)) {
      throw new Error(
        `MongoDBTableChanges field "${key}" has an invalid path. Received ${JSON.stringify(path)}.`
      );
    }
    if (keyByPath.has(path)) {
      throw new Error(
        `MongoDBTableChanges fields "${keyByPath.get(path)}" and "${key}" both write "${path}".`
      );
    }
    keyByPath.set(path, key);
    fieldsByKey.set(key, { key, type: field.type, family: fieldType.family, path });
  });
  return fieldsByKey;
}

export default normalizeChangeFields;
