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

import isControlTarget from '@lowdefy/blocks-antd/table/isControlTarget.js';

import isTextDrag from '../events/isTextDrag.js';

function closestInTable({ event, api, selector }) {
  const element = event.target.closest(selector);
  return element && api.contains(element) ? element : null;
}

function rowIdOf(element) {
  return element.closest('[data-row-key]')?.dataset.rowKey ?? null;
}

// Clicks the enrichment module owns, before sorting, selection and row events see them: the "+"
// header (the add-column picker), a row's run button (onRowRun), a stale cell's rerun button
// (onCellRun), and a click on an enrichment, ai or extract cell, which opens its details panel
// instead of a row click.
function handleEnrichmentClick(event, api) {
  const addColumn = closestInTable({ event, api, selector: '[data-lf-enrich-add-column]' });
  if (addColumn) {
    api.actions.openColumnPicker({ position: null });
    return true;
  }
  const runRow = closestInTable({ event, api, selector: '[data-lf-enrich-run-row]' });
  if (runRow) {
    const rowId = rowIdOf(runRow);
    if (rowId !== null) api.actions.runRow({ rowId });
    return true;
  }
  const rerun = closestInTable({ event, api, selector: '[data-lf-enrich-rerun]' });
  if (rerun) {
    const rowId = rowIdOf(rerun);
    if (rowId !== null) api.actions.runCell({ rowId, key: rerun.dataset.lfEnrichRerun });
    return true;
  }
  const cell = closestInTable({ event, api, selector: '[data-lf-cell]' });
  if (!cell || cell.hasAttribute('data-lf-header')) return false;
  const key = cell.dataset.colKey;
  if (!api.config.enrichment.detailColumns.has(key)) return false;
  const rowElement = cell.closest('[data-row-key]');
  if (!rowElement || rowElement.hasAttribute('data-saving')) return false;
  if (isControlTarget({ target: event.target, container: rowElement })) return false;
  if (isTextDrag({ event, api })) return true;
  api.actions.openCellDetails({ rowId: rowElement.dataset.rowKey, key });
  return true;
}

export default handleEnrichmentClick;
