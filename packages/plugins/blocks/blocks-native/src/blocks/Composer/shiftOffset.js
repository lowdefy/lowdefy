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
 * Where an offset of the shown text lands after edits replaced ranges of it: moved by the
 * change in length of every edit before it, or to the end of what an edit put in when it sat
 * inside the edit's range.
 *
 * @param {Object} params
 * @param {number} params.offset
 * @param {Array<{ start: number, end: number, length: number }>} params.edits In text order.
 * @returns {number}
 */
function shiftOffset({ offset, edits }) {
  let shift = 0;
  for (const edit of edits) {
    if (offset >= edit.end) {
      shift += edit.length - (edit.end - edit.start);
    } else if (offset > edit.start) {
      return edit.start + shift + edit.length;
    } else {
      break;
    }
  }
  return offset + shift;
}

export default shiftOffset;
