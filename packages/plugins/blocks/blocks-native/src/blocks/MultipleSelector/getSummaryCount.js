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
/**
 * How many of a MultipleSelector's chosen labels its row shows before "+N": the labels, joined
 * with ", ", that end within the first line of the joined text laid out in the room the row
 * leaves beside "+N". At least one, which the row truncates with an ellipsis.
 *
 * @param {Object} params
 * @param {string[]} params.labels
 * @param {string} params.lineText The text of the first line, as onTextLayout reports it.
 * @returns {number}
 */
function getSummaryCount({ labels, lineText }) {
  let count = 0;
  let joined = '';
  for (const label of labels) {
    joined = count === 0 ? label : `${joined}, ${label}`;
    const ends = lineText.length === joined.length || /^[,\s]/.test(lineText.slice(joined.length));
    if (!lineText.startsWith(joined) || !ends) break;
    count += 1;
  }
  return Math.max(count, 1);
}

export default getSummaryCount;
