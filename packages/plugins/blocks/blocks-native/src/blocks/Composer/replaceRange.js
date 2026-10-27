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

import { charsOf, fromAtoms, toAtoms } from './segmentText.js';

/**
 * Replaces the shown text in [from, to) with `units` (characters from charsOf, or { segment }
 * for a mention), adding a space after them unless whitespace already follows. The range is the
 * @ or `[[` and its query, which are plain text. The cursor goes after what was put in and the
 * space that follows it.
 *
 * @param {Object} params
 * @param {Array} params.segments
 * @param {number} params.from
 * @param {number} params.to
 * @param {Array} params.units
 * @returns {{ segments: Array, cursor: number }}
 */
function replaceRange({ segments, from, to, units }) {
  const atoms = toAtoms(segments);
  const before = atoms.filter((atom) => atom.end <= from);
  const after = atoms.filter((atom) => atom.start >= to);
  const spaced = after.length > 0 && /^\s/.test(after[0].char ?? '');
  const inserted = spaced ? units : [...units, ...charsOf(' ')];
  const next = fromAtoms([...before, ...inserted, ...after]);
  const insertedLength = inserted.reduce(
    (sum, unit) => sum + (unit.segment ? `@${unit.segment.name}`.length : unit.char.length),
    0
  );
  return { segments: next, cursor: from + insertedLength + (spaced ? 1 : 0) };
}

export default replaceRange;
