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

import { set } from '@lowdefy/helpers';

import coerceCellValue from '../editing/coerceCellValue.js';
import createValueSpec from './createValueSpec.js';
import generateColumnKey from './generateColumnKey.js';
import { NEW_COLUMN, SKIP_COLUMN } from './matchCsvHeaders.js';

function createTargets({ headers, mapping, columnsByKey, existingKeys }) {
  const keys = [...existingKeys];
  const newColumns = [];
  const targets = headers.map((header, index) => {
    const target = mapping[index];
    if (target === SKIP_COLUMN || target === undefined) return null;
    if (target === NEW_COLUMN) {
      const key = generateColumnKey({ title: header, existingKeys: keys });
      keys.push(key);
      const column = {
        key,
        title: header.trim() === '' ? key : header.trim(),
        type: 'text',
        kind: 'input',
        editable: true,
        userDefined: true,
      };
      newColumns.push(column);
      return { field: key, spec: null };
    }
    const column = columnsByKey.get(target);
    return { field: column.field, spec: createValueSpec(column) };
  });
  return { targets, newColumns };
}

// The rows a CSV import sends (onImport): one object per record with the mapped fields set at
// each column's `field` path, the text coerced to the column's type (a text that does not fit is
// kept as it is, so no data is lost), and empty cells left out. Headers mapped to NEW_COLUMN
// become new text input columns (`newColumns`, keys from their titles) whose values sit at their
// key. Records with no mapped value are dropped (`skipped` counts them).
function buildImportRows({ records, headers, mapping, columnsByKey, existingKeys }) {
  const { targets, newColumns } = createTargets({ headers, mapping, columnsByKey, existingKeys });
  const rows = [];
  let skipped = 0;
  records.forEach((record) => {
    const row = {};
    let filled = false;
    targets.forEach((target, index) => {
      const text = record[index] ?? '';
      if (target === null || text.trim() === '') return;
      let value = text;
      if (target.spec !== null) {
        const coerced = coerceCellValue({ spec: target.spec, text });
        if (!coerced.error) value = coerced.value;
      }
      set(row, target.field, value);
      filled = true;
    });
    if (filled) rows.push(row);
    else skipped += 1;
  });
  return { rows, newColumns, skipped };
}

export default buildImportRows;
