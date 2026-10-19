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

import TRAILING_COLUMN_KEY from './trailingColumnKey.js';

function handleTrailingCell({ event, api, cell }) {
  if (cell.hasAttribute('data-lf-header')) {
    if (!api.config.enrichment.addColumn) return false;
    event.preventDefault();
    api.actions.openColumnPicker({ position: null });
    return true;
  }
  const rowId = cell.closest('[data-row-key]')?.dataset.rowKey;
  if (!rowId || !cell.querySelector('[data-lf-enrich-run-row]')) return false;
  event.preventDefault();
  api.actions.runRow({ rowId });
  return true;
}

// Keys on a focused cell, before editing and keyboard navigation: Enter or Space on the "+"
// header opens the add-column picker and on a row's run cell runs the row; Space on an
// enrichment, ai or extract cell opens its details panel (instead of selecting the row).
function handleEnrichmentKeyDown(event, api) {
  if (event.key !== ' ' && event.key !== 'Enter') return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  const cell = event.target.closest('[data-lf-cell]');
  if (!cell || event.target !== cell || !api.contains(cell)) return false;
  const key = cell.dataset.colKey;
  if (key === TRAILING_COLUMN_KEY) return handleTrailingCell({ event, api, cell });
  if (event.key !== ' ' || cell.hasAttribute('data-lf-header')) return false;
  if (!api.config.enrichment.detailColumns.has(key)) return false;
  const rowId = cell.closest('[data-row-key]')?.dataset.rowKey;
  if (!rowId) return false;
  event.preventDefault();
  api.actions.openCellDetails({ rowId, key });
  return true;
}

export default handleEnrichmentKeyDown;
