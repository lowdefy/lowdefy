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

const maxColumns = 50;

// The enrichment columns a request runs on: `columns` (keys of enrichment or ai columns in
// `columnDefs`), or every enrichment and ai column when `columns` is optional and left out,
// narrowed to the columns of `providers` when that is set.
function getTargetColumns({ columns, columnDefsByKey, providers, required, requestType }) {
  if (type.isNone(columns) && required) {
    throw new Error(`${requestType} requires "columns", the enrichment column keys to run.`);
  }
  let keys;
  if (type.isNone(columns)) {
    keys = [...columnDefsByKey.values()]
      .filter((columnDef) => columnDef.runnable)
      .map((columnDef) => columnDef.key);
  } else {
    if (!type.isArray(columns) || columns.length === 0 || !columns.every(type.isString)) {
      throw new Error(
        `${requestType} "columns" should be a non-empty array of column keys. Received ${JSON.stringify(
          columns
        )}.`
      );
    }
    keys = [...new Set(columns)];
  }
  if (keys.length > maxColumns) {
    throw new Error(
      `${requestType} runs at most ${maxColumns} columns at once. Received ${keys.length}.`
    );
  }
  const targets = keys.map((key) => {
    const columnDef = columnDefsByKey.get(key);
    if (columnDef?.runnable !== true) {
      throw new Error(
        `${requestType} "columns" names ${JSON.stringify(
          key
        )}, which is not an enrichment or ai column of "columnDefs".`
      );
    }
    return columnDef;
  });
  if (type.isNone(providers)) return targets;
  if (!type.isArray(providers) || !providers.every(type.isString)) {
    throw new Error(
      `${requestType} "providers" should be an array of provider ids. Received ${JSON.stringify(
        providers
      )}.`
    );
  }
  return targets.filter((columnDef) => providers.includes(columnDef.provider));
}

export default getTargetColumns;
