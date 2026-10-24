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

import getBarWidth from './getBarWidth.js';

/**
 * The widths of a paragraph's loading lines: full lines that end a little short of the edge, as
 * wrapped text does, then a ragged end, the second last line shorter and the last one well short.
 * A single line is a short sentence.
 *
 * @param {Object} params
 * @param {number} params.lines
 * @param {number} [params.salt] Varies the widths between paragraphs.
 * @returns {string[]} Percentages.
 */
function getParagraphWidths({ lines, salt = 0 }) {
  if (lines === 1) {
    return [getBarWidth({ index: salt, max: 85, min: 55 })];
  }
  return Array.from({ length: lines }, (_, line) => {
    const index = line + salt;
    if (line === lines - 1) return getBarWidth({ index, max: 70, min: 35 });
    if (line === lines - 2 && lines > 2) return getBarWidth({ index, max: 92, min: 80 });
    return getBarWidth({ index, max: 100, min: 94 });
  });
}

export default getParagraphWidths;
