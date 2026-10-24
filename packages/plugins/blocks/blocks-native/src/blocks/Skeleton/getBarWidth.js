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

// A spread of fractions that reads as natural text: rows of a list end at different places, never
// in a visible pattern of long, short, long.
const FRACTIONS = [0.72, 0.31, 0.94, 0.55, 0.12, 0.83, 0.42, 1, 0.24, 0.66, 0.05];

/**
 * A bar's width for a row or line, as a percentage between `min` and `max`: the same for the same
 * index and salt, so a skeleton draws the same on every render, and varied from row to row.
 * `salt` varies the pick between the bars of one row (the title and the subtitle).
 *
 * @param {Object} params
 * @param {number} params.index The row or line.
 * @param {number} params.max
 * @param {number} params.min
 * @param {number} [params.salt]
 * @returns {string} A percentage, as `'72%'`.
 */
function getBarWidth({ index, max, min, salt = 0 }) {
  const fraction = FRACTIONS[(index + salt * 4) % FRACTIONS.length];
  return `${Math.round(min + fraction * (max - min))}%`;
}

export default getBarWidth;
