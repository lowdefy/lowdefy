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

import { get, type } from '@lowdefy/helpers';

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
  // A cell option that reads another row field into the cell, such as a
  // colour, draws that field as more than text.
  const cell = column[mark.cell];
  if (type.isObject(cell) && mark.cellRowKeys.some((key) => !type.isNone(cell[key]))) {
    return false;
  }
  return mark.textTypes.includes(column[mark.type] ?? mark.defaultType);
}

function isDataRows({ properties, key, mark }) {
  if (!type.isArray(properties[key])) {
    return false;
  }
  if (mark.drawnBy.some((drawnBy) => !type.isNone(get(properties, drawnBy)))) {
    return false;
  }
  const columns = properties[mark.columns];
  if (!type.isNone(columns) && !type.isArray(columns)) {
    return false;
  }
  return flattenColumns({ columns, mark }).every((column) => drawsAsText({ column, mark }));
}

// Returns the paths of row lists that are data: a top-level property whose
// schema marks it with rowsKind, holding an array, where every column of the
// sibling columns property draws its cell as text and nothing else draws the
// rows. A column whose type draws a link, an image or HTML, or whose cell
// options read a row field into the cell, leaves the rows to every check.
// rowsKind names the columns property; a column's type, children and cell
// options keys; the type a column without one has; the text types; the cell
// options that read a row field; and the properties (dot paths) that draw rows
// themselves when set:
// { columns, type, children, cell, cellRowKeys, drawnBy, defaultType, textTypes }.
function findDataRows({ properties, schema, path }) {
  if (!type.isObject(properties) || !type.isObject(schema?.properties)) {
    return [];
  }
  return Object.keys(schema.properties)
    .filter((key) => {
      const mark = schema.properties[key].rowsKind;
      return type.isObject(mark) && isDataRows({ properties, key, mark });
    })
    .map((key) => `${path}.${key}`);
}

export default findDataRows;
