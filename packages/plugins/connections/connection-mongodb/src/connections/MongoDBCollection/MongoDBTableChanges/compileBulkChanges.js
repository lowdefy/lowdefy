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

import compileSelectionMatches from './compileSelectionMatches.js';
import parseBulkUpdate from './parseBulkUpdate.js';
import parseSelection from './parseSelection.js';

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
  const selection = parseSelection({
    selection: properties.selection,
    rowKeyType,
    maxKeys: maxChanges,
  });
  const update = parseBulkUpdate({
    set: properties.set,
    unset: properties.unset,
    fieldsByKey,
    keyField: rowKeyField,
  });
  const conditions = [
    ...(Object.keys(filter).length === 0 ? [] : [filter]),
    ...compileSelectionMatches({
      selection,
      queryFields: properties.queryFields,
      user: properties.user,
      timezone: properties.timezone,
      now,
      rowKeyField,
      rowKeyType,
    }),
  ];
  let match = { $and: conditions };
  if (conditions.length === 0) match = {};
  if (conditions.length === 1) [match] = conditions;
  return { operations: [{ updateMany: { filter: match, update } }] };
}

export default compileBulkChanges;
