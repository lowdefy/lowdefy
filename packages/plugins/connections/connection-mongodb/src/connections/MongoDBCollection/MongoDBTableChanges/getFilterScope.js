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

// The value a filter condition matches by equality: a plain value (a scalar, ObjectId, date,
// array or embedded document) or { $eq: value }. Anything else ({ $ne }, { $in }, a regex) is
// not one value a new row can be given.
function getEquality(value) {
  if (type.isRegExp(value)) return { isEquality: false };
  if (!type.isObject(value)) return { isEquality: true, value };
  const keys = Object.keys(value);
  if (keys.length === 1 && keys[0] === '$eq') return { isEquality: true, value: value.$eq };
  if (keys.some((key) => key.startsWith('$'))) return { isEquality: false };
  return { isEquality: true, value };
}

function readFilter({ filter, scope, stampable }) {
  Object.entries(filter).forEach(([key, value]) => {
    const isLogical = key === '$and' || key === '$or' || key === '$nor';
    if (isLogical && type.isArray(value) && value.every(type.isObject)) {
      // Every clause of an $and holds for a row, so its equalities can be stamped; an $or or
      // $nor clause need not, so its conditions are only named.
      value.forEach((clause) => {
        readFilter({ filter: clause, scope, stampable: stampable && key === '$and' });
      });
      return;
    }
    if (key.startsWith('$')) {
      scope.operators.push(key);
      return;
    }
    scope.paths.push(key);
    const equality = getEquality(value);
    if (stampable && equality.isEquality) {
      scope.equalities.push({ path: key, value: equality.value });
    } else {
      scope.conditions.push(key);
    }
  });
}

// What the base filter scopes rows by:
//   paths:      every field path it names, at any depth of $and, $or and $nor;
//   equalities: [{ path, value }] every row in scope has, which new rows are stamped with;
//   conditions: paths it matches some other way, which new rows need from insertDefaults;
//   operators:  top-level operators such as $expr or $where, which new rows can not be
//               checked against.
function getFilterScope({ filter }) {
  const scope = { paths: [], equalities: [], conditions: [], operators: [] };
  readFilter({ filter, scope, stampable: true });
  return scope;
}

export default getFilterScope;
