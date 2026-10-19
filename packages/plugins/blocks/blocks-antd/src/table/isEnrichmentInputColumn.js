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

import CELL_TYPE_FAMILIES from './cellTypeFamilies.js';

// Formula and extract columns compute in the browser, so they are never stored: the server
// resolves an enrichment or ai input from a stored row field or from `_enrich.<key>.value`.
const BROWSER_KINDS = new Set(['formula', 'extract']);

// Whether an enrichment or ai column can take its input from `column`: an input column, a plain
// data column (a stored field), or another enrichment or ai column (its result, once ok). Not a
// formula or extract column, whose value the server can not read, and not buttons or menus.
// The picker offers these, linkColumnKinds refuses the rest, and the server's column check
// applies the same rule.
function isEnrichmentInputColumn(column) {
  return !BROWSER_KINDS.has(column.kind) && CELL_TYPE_FAMILIES[column.type] !== 'action';
}

export default isEnrichmentInputColumn;
