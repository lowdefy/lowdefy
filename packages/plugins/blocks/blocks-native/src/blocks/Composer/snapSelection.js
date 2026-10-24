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

import { toAtoms } from './segmentText.js';

/**
 * A collapsed cursor placed inside a mention's "@Name" moves to the mention's end, so the
 * cursor steps over a mention as one character. Any other selection is returned as it is.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {{ start: number, end: number }} params.selection
 * @returns {{ start: number, end: number }}
 */
function snapSelection({ segments, selection }) {
  if (selection.start !== selection.end) {
    return selection;
  }
  const inside = toAtoms(segments).find(
    (atom) => atom.segment && atom.start < selection.start && atom.end > selection.start
  );
  if (!inside) {
    return selection;
  }
  return { start: inside.end, end: inside.end };
}

export default snapSelection;
