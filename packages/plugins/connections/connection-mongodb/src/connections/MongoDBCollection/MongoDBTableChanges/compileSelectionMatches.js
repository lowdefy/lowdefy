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
import getTimeZone from '../MongoDBTableQuery/getTimeZone.js';
import normalizeFields from '../MongoDBTableQuery/normalizeFields.js';
import validateView from '../MongoDBTableQuery/validateView.js';
import getKeyForms from './getKeyForms.js';

// The view of a select-all selection, compiled by MongoDBTableQuery's own validator and
// compiler against the table's MongoDBTableQuery fields, so it matches the rows the table
// showed, with the same limits and refusals.
function compileViewMatches({
  selection,
  queryFields,
  queryFieldsName,
  user,
  timezone,
  now,
  requestType,
}) {
  if (type.isNone(selection.filter) && type.isNone(selection.search)) return [];
  if (type.isNone(queryFields)) {
    throw new Error(
      `${requestType} "selection" has a filter or search, so the request needs "${queryFieldsName}", the MongoDBTableQuery fields of the table.`
    );
  }
  const fieldsByKey = normalizeFields({ fields: queryFields });
  const timeZone = getTimeZone({ timezone, requestType });
  const view = validateView({
    view: { filter: selection.filter, search: selection.search },
    fieldsByKey,
    user,
    timeZone,
  });
  return [
    type.isNone(view.filter)
      ? null
      : compileCondition({ condition: view.filter, fieldsByKey, now, timeZone }),
    compileSearch({ search: view.search, fieldsByKey }),
  ].filter((match) => match !== null);
}

function compileKeyMatch({ selection, rowKeyField, rowKeyType }) {
  const keys = selection.all ? selection.except : selection.keys;
  if (keys.length === 0) return [];
  const forms = keys.flatMap((key) => getKeyForms({ key, rowKeyType }));
  return [{ [rowKeyField]: { [selection.all ? '$nin' : '$in']: forms } }];
}

// The conditions a parsed Table selection adds to the base filter: the view's filter and
// search for a select-all selection, and the selected (or excepted) row keys. Each is one
// clause of an $and with the base filter, so a selection can only narrow the rows.
function compileSelectionMatches({
  selection,
  queryFields,
  queryFieldsName = 'queryFields',
  user,
  timezone,
  now,
  rowKeyField,
  rowKeyType,
  requestType = 'MongoDBTableChanges',
}) {
  return [
    ...(selection.all
      ? compileViewMatches({
          selection,
          queryFields,
          queryFieldsName,
          user,
          timezone,
          now,
          requestType,
        })
      : []),
    ...compileKeyMatch({ selection, rowKeyField, rowKeyType }),
  ];
}

export default compileSelectionMatches;
