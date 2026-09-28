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

import { get } from '@lowdefy/helpers';

import validateCellValue from './validateCellValue.js';

const EMPTY = new Map();

// TableInput's inline validation: every cell whose value fails its column's `required` or
// `validate`, as rowKey -> (columnKey -> message). Only columns with checks are visited.
function findInvalidCells({ rows, specs, getKey }) {
  const checked = [...specs.values()].filter((spec) => spec.required || spec.validate.length > 0);
  if (checked.length === 0) return EMPTY;
  const invalid = new Map();
  rows.forEach((row) => {
    checked.forEach((spec) => {
      const message = validateCellValue({ spec, row, value: get(row, spec.field) });
      if (message === null) return;
      const key = String(getKey(row));
      if (!invalid.has(key)) invalid.set(key, new Map());
      invalid.get(key).set(spec.key, message);
    });
  });
  return invalid;
}

export default findInvalidCells;
