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

import toCellValue from './toCellValue.js';

// Build a report IR table cell. `value` is the raw typed datum, coerced to a
// primitive or Date; `formatted` is the display string when a formatter ran.
// The PDF renders `formatted ?? value`; xlsx writes the typed `value`.
function cell(value, formatted) {
  const cellValue = toCellValue(value);
  if (formatted === undefined) {
    return { value: cellValue };
  }
  return { value: cellValue, formatted: String(formatted) };
}

export default cell;
