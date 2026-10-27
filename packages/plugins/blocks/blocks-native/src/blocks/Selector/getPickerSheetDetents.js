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

import getSheetDetents from '../Sheet/getSheetDetents.js';

// The heights the sheet's content is laid out with, in points.
const HEADER_HEIGHT = 44;
const ROW_HEIGHT = 52;
const SEARCH_HEIGHT = 52;
// The drag indicator's space above the header and the home indicator's below the list.
const SHEET_CHROME_HEIGHT = 56;
// The medium detent's share of the screen.
const MEDIUM_FRACTION = 0.5;

/**
 * The BottomSheet props that give a Selector picker sheet its detents. A list that fits at the
 * medium height rests there alone. A longer list, or one with a search field (which takes the
 * sheet to the large height while it is focused), gets the medium and large detents.
 *
 * @param {Object} params
 * @param {string} params.platform Platform.OS.
 * @param {number} params.rowCount The rows before any search.
 * @param {boolean} params.searchShown
 * @param {number} params.windowHeight
 * @returns {{ snapPoints: (string[]|undefined), resizable: boolean }} As getSheetDetents gives
 *   them; resizable is whether the sheet has a large detent.
 */
function getPickerSheetDetents({ platform, rowCount, searchShown, windowHeight }) {
  const contentHeight =
    SHEET_CHROME_HEIGHT + HEADER_HEIGHT + (searchShown ? SEARCH_HEIGHT : 0) + rowCount * ROW_HEIGHT;
  const long = contentHeight > windowHeight * MEDIUM_FRACTION;
  return getSheetDetents({ detents: long || searchShown ? 'both' : 'medium', platform });
}

export { HEADER_HEIGHT, MEDIUM_FRACTION, ROW_HEIGHT, SEARCH_HEIGHT, SHEET_CHROME_HEIGHT };
export default getPickerSheetDetents;
