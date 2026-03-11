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

import { createBlockHelper, escapeId } from '@lowdefy/e2e-utils';
import { expect } from '@playwright/test';

const locator = (page, blockId) => page.locator(`#${escapeId(blockId)} .ag-root-wrapper`);

export default createBlockHelper({
  locator,
  do: {
    clickRow: (page, blockId, rowIndex) =>
      locator(page, blockId).locator(`.ag-row[row-index="${rowIndex}"] .ag-cell`).first().click(),
    clickHeader: (page, blockId, colIndex) =>
      locator(page, blockId).locator('.ag-header-cell-text').nth(colIndex).click(),
    editCell: (page, blockId, rowIndex, colIndex) =>
      locator(page, blockId)
        .locator(`.ag-row[row-index="${rowIndex}"] .ag-cell`)
        .nth(colIndex)
        .dblclick(),
  },
  get: {
    headerCells: (page, blockId) => locator(page, blockId).locator('.ag-header-cell-text'),
    rows: (page, blockId) => locator(page, blockId).locator('.ag-row'),
    cellEditor: (page, blockId) => locator(page, blockId).locator('.ag-cell-editor input'),
  },
  expect: {
    rowCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('.ag-row')).toHaveCount(count),
    headerCount: (page, blockId, count) =>
      expect(locator(page, blockId).locator('.ag-header-cell-text')).toHaveCount(count),
    cellText: (page, blockId, rowIndex, colIndex, text) =>
      expect(
        locator(page, blockId).locator(`.ag-row[row-index="${rowIndex}"] .ag-cell`).nth(colIndex)
      ).toHaveText(text),
    themeClass: (page, blockId) =>
      expect(page.locator(`#${escapeId(blockId)}`)).toHaveClass(/ag-theme-alpine-dark/),
    dragHandle: (page, blockId, rowIndex) =>
      expect(
        locator(page, blockId).locator(`.ag-row[row-index="${rowIndex}"] .ag-drag-handle`)
      ).toBeVisible(),
  },
});
