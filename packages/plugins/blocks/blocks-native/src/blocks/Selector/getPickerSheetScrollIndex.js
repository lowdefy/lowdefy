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

import {
  HEADER_HEIGHT,
  MEDIUM_FRACTION,
  ROW_HEIGHT,
  SEARCH_HEIGHT,
  SHEET_CHROME_HEIGHT,
} from './getPickerSheetDetents.js';

// Rows kept above the chosen row when the list opens scrolled to it.
const ROWS_ABOVE_SELECTED = 2;

/**
 * The row a picker sheet's list opens scrolled to: the top, unless the chosen row would sit
 * below what the medium detent shows, when the list opens with the chosen row near its top.
 *
 * @param {Object} params
 * @param {boolean} params.searchShown
 * @param {number} params.selectedPosition The chosen row's position in the list, or -1.
 * @param {number} params.windowHeight
 * @returns {number}
 */
function getPickerSheetScrollIndex({ searchShown, selectedPosition, windowHeight }) {
  const listHeight =
    windowHeight * MEDIUM_FRACTION -
    SHEET_CHROME_HEIGHT -
    HEADER_HEIGHT -
    (searchShown ? SEARCH_HEIGHT : 0);
  const visibleRows = Math.floor(listHeight / ROW_HEIGHT);
  if (selectedPosition < visibleRows) {
    return 0;
  }
  return selectedPosition - ROWS_ABOVE_SELECTED;
}

export default getPickerSheetScrollIndex;
