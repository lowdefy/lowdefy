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

import coerceRowKey from './coerceRowKey.js';
import compileArrayChanges from './compileArrayChanges.js';
import compileCollectionChanges from './compileCollectionChanges.js';
import isSafePath from './isSafePath.js';
import normalizeChangeFields from './normalizeChangeFields.js';
import parseChanges from './parseChanges.js';

const rowKeyTypes = ['auto', 'objectId', 'string', 'number'];

function assertPath({ name, value }) {
  if (!isSafePath(value)) {
    throw new Error(
      `MongoDBTableChanges "${name}" should be a dot path whose segments are not empty and do not start with "$". Received ${JSON.stringify(
        value
      )}.`
    );
  }
}

// Every write is scoped by `filter`. A tenant connection scopes it mechanically, so the
// filter may be left out there; anywhere else leaving it out is refused, and writing to any
// document of the collection has to be asked for with `filter: {}`.
function getFilter({ filter, tenantScoped }) {
  if (type.isNone(filter)) {
    if (tenantScoped) return {};
    throw new Error(
      'MongoDBTableChanges requires a "filter" that scopes every write, for example { org_id: { _user: organization.id } }. Set "filter: {}" to allow writes to every document in the collection.'
    );
  }
  if (!type.isObject(filter)) {
    throw new Error(
      `MongoDBTableChanges "filter" should be an object. Received ${JSON.stringify(filter)}.`
    );
  }
  return filter;
}

function getInsertDefaults({ insertDefaults }) {
  if (type.isNone(insertDefaults)) return {};
  if (!type.isObject(insertDefaults)) {
    throw new Error(
      `MongoDBTableChanges "insertDefaults" should be an object. Received ${JSON.stringify(
        insertDefaults
      )}.`
    );
  }
  Object.keys(insertDefaults).forEach((path) => {
    assertPath({ name: `insertDefaults.${path}`, value: path });
  });
  return insertDefaults;
}

function getArray({ array }) {
  if (!type.isObject(array)) {
    throw new Error(
      `MongoDBTableChanges "array" should be an object { documentId, path, itemKeyField }. Received ${JSON.stringify(
        array
      )}.`
    );
  }
  const itemKeyField = array.itemKeyField ?? '_id';
  assertPath({ name: 'array.path', value: array.path });
  assertPath({ name: 'array.itemKeyField', value: itemKeyField });
  const documentId = coerceRowKey({
    value: array.documentId,
    rowKeyType: 'auto',
    part: 'array.documentId',
  });
  return { documentId, itemKeyField, path: array.path };
}

// The request properties as bulkWrite operations. `generateId` makes the keys of new rows;
// it is passed in so a compile is deterministic in tests.
function compileTableChanges({ properties, tenantScoped, generateId }) {
  const rowKeyField = properties.rowKeyField ?? '_id';
  const rowKeyType = properties.rowKeyType ?? 'auto';
  const maxChanges = properties.maxChanges ?? 1000;
  const { positionField } = properties;
  if (!rowKeyTypes.includes(rowKeyType)) {
    throw new Error(
      `MongoDBTableChanges "rowKeyType" should be one of ${JSON.stringify(
        rowKeyTypes
      )}. Received ${JSON.stringify(rowKeyType)}.`
    );
  }
  if (!type.isInt(maxChanges) || maxChanges < 1) {
    throw new Error(
      `MongoDBTableChanges "maxChanges" should be a positive integer. Received ${JSON.stringify(
        maxChanges
      )}.`
    );
  }
  assertPath({ name: 'rowKeyField', value: rowKeyField });
  if (!type.isNone(positionField)) assertPath({ name: 'positionField', value: positionField });
  const fieldsByKey = normalizeChangeFields({ fields: properties.fields });
  const filter = getFilter({ filter: properties.filter, tenantScoped });
  const insertDefaults = getInsertDefaults({ insertDefaults: properties.insertDefaults });
  const array = type.isNone(properties.array) ? undefined : getArray({ array: properties.array });
  const changes = parseChanges({
    changes: properties.changes,
    fieldsByKey,
    keyField: array?.itemKeyField ?? rowKeyField,
    maxChanges,
    positionField,
    rowKeyType,
  });
  const options = { ...(properties.options ?? {}), ordered: properties.ordered ?? true };
  if (array !== undefined) {
    // The updates of one array build on each other (the order applies to the pushed items).
    if (options.ordered !== true) {
      throw new Error(
        'MongoDBTableChanges in array mode runs its updates of the document in order, so "ordered" can not be false.'
      );
    }
    return {
      mode: 'array',
      filter,
      options,
      insertedCount: changes.added.length,
      removedCount: changes.removed.length,
      ...compileArrayChanges({ array, changes, filter, generateId, insertDefaults }),
    };
  }
  if (changes.order !== undefined) {
    throw new Error(
      'MongoDBTableChanges changes have an "order", which needs a "positionField" to write positions to (or "array" mode, where the array order is the row order).'
    );
  }
  return {
    mode: 'collection',
    filter,
    options,
    ...compileCollectionChanges({ changes, filter, generateId, insertDefaults, rowKeyField }),
  };
}

export default compileTableChanges;
