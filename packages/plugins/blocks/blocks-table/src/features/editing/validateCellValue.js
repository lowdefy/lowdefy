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

import isEmptyValue from '@lowdefy/blocks-antd/table/isEmptyValue.js';

// The first failing message for a cell value, or null when it passes. `row` is the row with the
// new value already in it, so a `pass` condition with a `key` reads the edited row.
function validateCellValue({ spec, row, value }) {
  if (spec.required && isEmptyValue(value)) return 'Required.';
  for (const rule of spec.validate) {
    if (rule.test(row, value) !== true) return rule.message;
  }
  return null;
}

export default validateCellValue;
