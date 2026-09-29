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

import compileCondition from '../MongoDBTableQuery/compileCondition.js';
import compileSearch from '../MongoDBTableQuery/compileSearch.js';
import normalizeFields from '../MongoDBTableQuery/normalizeFields.js';
import validateView from '../MongoDBTableQuery/validateView.js';
import getKeyForms from './getKeyForms.js';
import parseBulkUpdate from './parseBulkUpdate.js';
import parseSelection from './parseSelection.js';

// The view of a select-all selection, compiled by MongoDBTableQuery's own validator and
// compiler against `queryFields` (the table's MongoDBTableQuery fields), so it matches the
// rows the table showed, with the same limits and refusals.
function compileViewMatches({ selection, queryFields, user, now }) {
  if (type.isNone(selection.filter) && type.isNone(selection.search)) return [];
  if (type.isNone(queryFields)) {
    throw new Error(
      'MongoDBTableChanges "selection" has a filter or search, so the request needs "queryFields", the MongoDBTableQuery fields of the table.'
    );
  }
  const fieldsByKey = normalizeFields({ fields: queryFields });
  const view = validateView({
    view: { filter: selection.filter, search: selection.search },
    fieldsByKey,
    user,
  });
  return [
    type.isNone(view.filter)
      ? null
      : compileCondition({ condition: view.filter, fieldsByKey, now }),
    compileSearch({ search: view.search, fieldsByKey }),
  ].filter((match) => match !== null);
}

function compileKeyMatch({ selection, rowKeyField, rowKeyType }) {
  const keys = selection.all ? selection.except : selection.keys;
  if (keys.length === 0) return [];
  const forms = keys.flatMap((key) => getKeyForms({ key, rowKeyType }));
  return [{ [rowKeyField]: { [selection.all ? '$nin' : '$in']: forms } }];
}

// Bulk mode: one set of field values written to every selected row with one updateMany,
// scoped by the base filter like every other write. The view and the keys can only narrow
// the filter: every condition is one clause of an $and.
function compileBulkChanges({
  properties,
  fieldsByKey,
  filter,
  rowKeyField,
  rowKeyType,
  maxChanges,
  now,
}) {
  const selection = parseSelection({ selection: properties.selection, rowKeyType, maxChanges });
  const update = parseBulkUpdate({
    set: properties.set,
    unset: properties.unset,
    fieldsByKey,
    keyField: rowKeyField,
  });
  const conditions = [
    ...(Object.keys(filter).length === 0 ? [] : [filter]),
    ...(selection.all
      ? compileViewMatches({
          selection,
          queryFields: properties.queryFields,
          user: properties.user,
          now,
        })
      : []),
    ...compileKeyMatch({ selection, rowKeyField, rowKeyType }),
  ];
  let match = { $and: conditions };
  if (conditions.length === 0) match = {};
  if (conditions.length === 1) [match] = conditions;
  return { operations: [{ updateMany: { filter: match, update } }] };
}

export default compileBulkChanges;
