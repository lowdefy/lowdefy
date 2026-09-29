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

import LazyCellDetails from './LazyCellDetails.js';
import LazyColumnPicker from './LazyColumnPicker.js';
import TRAILING_COLUMN_KEY from './trailingColumnKey.js';

// Pointer-over and focus inside the grid: starts loading the overlay a click or key there would
// open, so it opens without a wait: the column picker from the "+" header, the details panel
// from an enrichment, ai or extract cell. Never claims the event.
function handleEnrichmentPreload(event, api) {
  const cell = event.target.closest?.('[data-lf-cell]');
  if (!cell || !api.contains(cell)) return false;
  const key = cell.dataset.colKey;
  if (cell.hasAttribute('data-lf-header')) {
    if (key === TRAILING_COLUMN_KEY && api.config.enrichment.addColumn) LazyColumnPicker.preload();
    return false;
  }
  if (api.config.enrichment.detailColumns.has(key)) LazyCellDetails.preload();
  return false;
}

export default handleEnrichmentPreload;
