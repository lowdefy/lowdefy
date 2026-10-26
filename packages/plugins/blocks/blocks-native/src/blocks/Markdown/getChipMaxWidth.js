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

// A chip with text after it leaves the rest of the line to that text, as a web chip does,
// rather than filling the line and pushing the sentence onto the next one.
export const FOLLOWED_SHARE = 0.75;

/**
 * The widest a link chip (with any punctuation drawn after it) may be: the width of the text it
 * sits in, or three quarters of it when text follows the chip on its line. The chip is as wide
 * as its content up to this; past it its title is cut short.
 *
 * @param {Object} params
 * @param {boolean} params.followed Text follows the chip on its line (layoutLinkChips).
 * @param {number} params.width The width of the text the chip sits in (ChipWidthContext).
 * @returns {number}
 */
function getChipMaxWidth({ followed, width }) {
  if (!followed) {
    return width;
  }
  return Math.floor(width * FOLLOWED_SHARE);
}

export default getChipMaxWidth;
