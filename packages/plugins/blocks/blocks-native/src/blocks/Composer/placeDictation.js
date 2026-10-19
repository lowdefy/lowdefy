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
import { charsOf, fromAtoms, toAtoms, toDisplay } from './segmentText.js';

/**
 * Puts dictated words into the composer's segments at a selection of the shown text, as plain
 * text, with insertAtSelection's spacing: they replace the selected range, or go in at the
 * cursor. A mention is one unit, so one the range only partly covers goes with it.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {{ start: number, end: number }} params.selection In offsets of the shown text.
 * @param {string} params.words
 * @returns {{ segments: Array, cursor: number, atEnd: boolean }} The new segments, the cursor
 *   just after the words, and whether the words end the text.
 */
function placeDictation({ segments, selection, words }) {
  const display = toDisplay(segments);
  const placed = insertAtSelection({ text: display, selection, insert: words });
  const inserted = placed.text.slice(selection.start, placed.cursor);
  const atoms = toAtoms(segments);
  const before = atoms.filter((atom) => atom.end <= selection.start);
  const after = atoms.filter((atom) => atom.start >= selection.end);
  const next = fromAtoms([...before, ...charsOf(inserted), ...after]);
  const beforeLength = before.reduce((sum, atom) => sum + atom.end - atom.start, 0);
  return { segments: next, cursor: beforeLength + inserted.length, atEnd: after.length === 0 };
}

export default placeDictation;
