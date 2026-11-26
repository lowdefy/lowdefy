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

const ENRICHMENT_KINDS = new Set(['enrichment', 'ai', 'extract']);

// Whether a raw column config makes a Table load its enrichment feature: an enrichment, ai or
// extract column, a run state (`status`), or a user-defined column (its header menu manages it).
// blocks-table's needsEnrichment tests the columns with it, and the headless Table stand-in leaves
// such a table to the browser, since the feature owns clicks on its cells.
function columnNeedsEnrichment(column) {
  return (
    ENRICHMENT_KINDS.has(column.kind) ||
    !type.isUndefined(column.status) ||
    column.userDefined === true
  );
}

export default columnNeedsEnrichment;
