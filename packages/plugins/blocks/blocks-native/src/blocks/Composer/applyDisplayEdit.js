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

// The edit that turns `previous` into `next`: the range of `previous` it replaced and the text
// it put there. Of the ranges that explain the change, it takes the one at the cursor, so
// deleting one of two equal characters deletes the one before the cursor.
function findEdit({ previous, next, selection }) {
  let prefix = 0;
  const shortest = Math.min(previous.length, next.length);
  while (prefix < shortest && previous[prefix] === next[prefix]) {
    prefix += 1;
  }
  if (selection) {
    const removed = previous.length - next.length;
    const collapsed = selection.start === selection.end;
    const limit = collapsed && removed > 0 ? selection.start - removed : selection.start;
    prefix = Math.max(0, Math.min(prefix, limit));
  }
  let suffix = 0;
  while (
    suffix < previous.length - prefix &&
    suffix < next.length - prefix &&
    previous[previous.length - 1 - suffix] === next[next.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  return {
    start: prefix,
    end: previous.length - suffix,
    inserted: next.slice(prefix, next.length - suffix),
  };
}

/**
 * Applies a change of the input's text to its segments. A mention is one unit: a deletion that
 * touches any of its characters (Backspace at its end) removes all of it, and text typed inside
 * it goes after it.
 *
 * @param {Object} params
 * @param {Array} params.segments The segments the input showed.
 * @param {string} params.previous The text the input showed (toDisplay of segments).
 * @param {string} params.next The text the input reports now.
 * @param {{ start: number, end: number }} [params.selection] The selection before the change.
 * @returns {{ segments: Array, cursor: number, natural: number }} The new segments, where the
 *   cursor belongs, and where the input put it; they differ when a mention was removed or
 *   stepped over.
 */
function applyDisplayEdit({ segments, previous, next, selection }) {
  const edit = findEdit({ previous, next, selection });
  const atoms = toAtoms(segments);
  let before;
  let after;
  if (edit.start < edit.end) {
    before = atoms.filter((atom) => atom.end <= edit.start);
    after = atoms.filter((atom) => atom.start >= edit.end);
  } else {
    before = atoms.filter((atom) => atom.start < edit.start);
    after = atoms.filter((atom) => atom.start >= edit.start);
  }
  const beforeLength = before.reduce((sum, atom) => sum + atom.end - atom.start, 0);
  return {
    segments: fromAtoms([...before, ...charsOf(edit.inserted), ...after]),
    cursor: beforeLength + edit.inserted.length,
    natural: edit.start + edit.inserted.length,
  };
}

export default applyDisplayEdit;
