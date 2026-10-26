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

import insertAtSelection from '../../shared/dictation/insertAtSelection.js';
import { fromAtoms, toAtoms, toDisplay } from './segmentText.js';

/**
 * The composer's segments as the input shows them while dictation listens: the words still being
 * heard as a `partial` segment at the selection, spaced as placeDictation will put them, standing
 * in for a selected range they will replace. They are not part of the value.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {{ start: number, end: number }} params.selection In offsets of the shown text.
 * @param {string} params.partial
 * @returns {{ segments: Array, display: string }}
 */
function withPartial({ segments, selection, partial }) {
  const display = toDisplay(segments);
  const placed = insertAtSelection({ text: display, selection, insert: partial });
  const atoms = toAtoms(segments);
  const before = fromAtoms(atoms.filter((atom) => atom.end <= selection.start));
  const after = fromAtoms(atoms.filter((atom) => atom.start >= selection.end));
  const shown = [
    ...before,
    { kind: 'partial', text: placed.text.slice(selection.start, placed.cursor) },
    ...after,
  ];
  return { segments: shown, display: toDisplay(shown) };
}

export default withPartial;
