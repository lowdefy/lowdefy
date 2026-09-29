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

import coercePosition from './coercePosition.js';
import coerceFieldValue from './coerceFieldValue.js';
import isSafePath from './isSafePath.js';
import notInFieldsError from './notInFieldsError.js';

// Every proper prefix of a writable path: an added row holds a column "address.city" as
// { address: { city } }, so "address" is walked into, not refused.
function getPathPrefixes(paths) {
  const prefixes = new Set();
  paths.forEach((path) => {
    const segments = path.split('.');
    for (let length = 1; length < segments.length; length += 1) {
      prefixes.add(segments.slice(0, length).join('.'));
    }
  });
  return prefixes;
}

function collectValues({ source, prefix, context, patch, location }) {
  Object.entries(source).forEach(([name, value]) => {
    if (prefix === '' && name === 'rowKey') return;
    const key = prefix === '' ? name : `${prefix}.${name}`;
    if (!isSafePath(key)) {
      throw new Error(
        `MongoDBTableChanges ${location}: key ${JSON.stringify(
          key
        )} is not allowed. Changes can not name MongoDB operators or positional paths.`
      );
    }
    const field = context.fieldsByKey.get(key);
    if (field !== undefined) {
      patch.set(field.path, coerceFieldValue({ field, value, location }));
      return;
    }
    if (key === context.positionField) {
      patch.set(key, coercePosition({ value, location }));
      return;
    }
    if (type.isObject(value) && context.prefixes.has(key)) {
      collectValues({ source: value, prefix: key, context, patch, location });
      return;
    }
    throw notInFieldsError({ fieldsByKey: context.fieldsByKey, key, location });
  });
}

// `added` is [{ rowKey, ...fields }]: the new row's column values (nested by their dot paths)
// and its key, a temporary one the browser generated unless a column default gave a real key.
// The row's own position (TableInput writes it into the added row) is allowed with a
// positionField.
function parseAddedRows({ added, fieldsByKey, positionField }) {
  const context = {
    fieldsByKey,
    positionField,
    prefixes: getPathPrefixes(
      [...fieldsByKey.keys(), positionField].filter((path) => !type.isNone(path))
    ),
  };
  const seen = new Set();
  return added.map((entry, index) => {
    if (!type.isObject(entry)) {
      throw new Error(
        `MongoDBTableChanges added row ${index} should be an object. Received ${JSON.stringify(
          entry
        )}.`
      );
    }
    const { rowKey } = entry;
    if (!(type.isString(rowKey) && rowKey !== '') && !type.isNumber(rowKey)) {
      throw new Error(
        `MongoDBTableChanges added row ${index} should have a "rowKey" string or number. Received ${JSON.stringify(
          rowKey
        )}.`
      );
    }
    if (seen.has(String(rowKey))) {
      throw new Error(`MongoDBTableChanges added rowKey ${JSON.stringify(rowKey)} appears twice.`);
    }
    seen.add(String(rowKey));
    const patch = new Map();
    const location = `added row ${JSON.stringify(rowKey)}`;
    collectValues({ source: entry, prefix: '', context, patch, location });
    return { rowKey, patch };
  });
}

export default parseAddedRows;
