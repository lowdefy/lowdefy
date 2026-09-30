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

import someColumnConfig from '../../core/someColumnConfig.js';

const ENRICHMENT_KINDS = new Set(['enrichment', 'ai', 'extract']);

// Enrichment loads for a Table with enrichment, ai or extract columns, a run state (`status`),
// user-defined columns (their header menu manages them), a provider catalogue, the add-column
// picker, "+ New row" or CSV import. Formula columns alone do not need it: the shared column core
// reads them (`column.read`), so every table and TableLight can. Never for TableInput: it edits
// a changeset over `data`, where cells are not run and rows are added by its own "+ Add row"
// (the editing feature), so its meta takes none of the keys that turn enrichment on.
function needsEnrichment({ input, properties }) {
  if (input) return false;
  if (type.isArray(properties.providers) && properties.providers.length > 0) return true;
  if (properties.addColumn === true || type.isObject(properties.addColumn)) return true;
  if (properties.addRow === true || properties.importCsv === true) return true;
  return someColumnConfig({
    properties,
    test: (column) =>
      ENRICHMENT_KINDS.has(column.kind) ||
      !type.isUndefined(column.status) ||
      column.userDefined === true,
  });
}

export default needsEnrichment;
