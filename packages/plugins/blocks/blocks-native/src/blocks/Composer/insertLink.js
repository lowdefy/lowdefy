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

import { charsOf, toDisplay } from './segmentText.js';
import replaceRange from './replaceRange.js';

/**
 * Replaces the open `[[` and its query, [at, cursor) of the shown text, with the record link
 * `[[KEY]]`. A `]]` straight after the cursor is taken in, so the link is not closed twice.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {number} params.at The offset of the `[[`.
 * @param {number} params.cursor
 * @param {string} params.key
 * @returns {{ segments: Array, cursor: number }}
 */
function insertLink({ segments, at, cursor, key }) {
  const closed = toDisplay(segments).slice(cursor, cursor + 2) === ']]';
  return replaceRange({
    segments,
    from: at,
    to: closed ? cursor + 2 : cursor,
    units: charsOf(`[[${key}]]`),
  });
}

export default insertLink;
