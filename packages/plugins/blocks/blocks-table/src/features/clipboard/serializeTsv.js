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

function toField(value) {
  const text = type.isNone(value) ? '' : String(value);
  if (!/[\t\r\n"]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

// The inverse of parseTsv: a grid of values as TSV a spreadsheet pastes into cells.
function serializeTsv(grid) {
  return grid.map((row) => row.map(toField).join('\t')).join('\n');
}

export default serializeTsv;
