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

// Every column a columns list holds, column groups' children included.
function flattenColumns({ columns, mark }) {
  return (columns ?? []).flatMap((column) => {
    if (type.isObject(column) && type.isArray(column[mark.children])) {
      return [column, ...flattenColumns({ columns: column[mark.children], mark })];
    }
    return [column];
  });
}

function drawsAsText({ column, mark }) {
  if (type.isString(column)) {
    return mark.textTypes.includes(mark.defaultType);
  }
  if (!type.isObject(column)) {
    return false;
  }
  // A column group draws no cells of its own.
  if (type.isArray(column[mark.children]) && type.isNone(column[mark.type])) {
    return true;
  }
  return mark.textTypes.includes(column[mark.type] ?? mark.defaultType);
}

// Returns the paths of row lists that are data: a top-level property whose
// schema marks it with rowsKind, holding an array, where every column of the
// sibling columns property draws its cell as text. A column whose type draws a
// link, an image or HTML (or reads other row fields into one) leaves the rows
// to every check. rowsKind names the columns property, a column's type and
// children keys, the type a column without one has, and the text types:
// { columns, type, children, defaultType, textTypes }.
function findDataRows({ properties, schema, path }) {
  if (!type.isObject(properties) || !type.isObject(schema?.properties)) {
    return [];
  }
  return Object.keys(schema.properties)
    .filter((key) => {
      const mark = schema.properties[key].rowsKind;
      if (!type.isObject(mark) || !type.isArray(properties[key])) {
        return false;
      }
      const columns = properties[mark.columns];
      if (!type.isNone(columns) && !type.isArray(columns)) {
        return false;
      }
      return flattenColumns({ columns, mark }).every((column) => drawsAsText({ column, mark }));
    })
    .map((key) => `${path}.${key}`);
}

export default findDataRows;
