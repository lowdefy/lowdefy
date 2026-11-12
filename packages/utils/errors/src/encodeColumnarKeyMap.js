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

const BASE36_ID = /^[0-9a-z]+$/;

function idToNumber(id) {
  if (!BASE36_ID.test(id)) {
    return null;
  }
  const number = parseInt(id, 36);
  // A leading zero parses to another id's number, so only the canonical
  // spelling of a number is that number's id.
  return number.toString(36) === id ? number : null;
}

/**
 * Encodes a short-shape key map in columns, for production servers to hold in
 * memory. A key map of a million entries is a million objects when parsed
 * (about 130 bytes each); its columns are a few arrays of numbers and a table
 * of the distinct path segments, which repeat heavily. createColumnarKeyMap
 * reads it back.
 *
 * A full build's key ids are base-36 counters (makeId), so each id is its
 * number less `base`, an index into every column:
 *   segment[index] - the entry's index into segments, -1 where no entry has that id
 *   parent[index]  - the parent entry's index, -1 when the parent is not in the map
 *   line[index]    - the entry's line, 0 when it has none
 *   refs           - [index, refId] for each entry that sets `r` (refId may be null)
 *   ignoreBuildChecks - [index, value] for each entry that sets `i`
 *
 * @param {Object} params
 * @param {Object} params.keyMap - A key map whose entries are all in the short shape
 * @returns {Object} { base, segments, segment, parent, line, refs, ignoreBuildChecks }
 */
function encodeColumnarKeyMap({ keyMap }) {
  const ids = Object.keys(keyMap);
  if (ids.length === 0) {
    return {
      base: 0,
      segments: [],
      segment: [],
      parent: [],
      line: [],
      refs: [],
      ignoreBuildChecks: [],
    };
  }

  // A large app's key map has a million entries, and reading one from it by id
  // is the slow step, so each entry is read once and kept for the second loop.
  const entries = new Array(ids.length);
  const idNumbers = new Array(ids.length);
  const numbers = new Map();
  let base = Infinity;
  let top = -Infinity;
  for (let position = 0; position < ids.length; position += 1) {
    const id = ids[position];
    const number = idToNumber(id);
    if (number === null) {
      throw new Error(
        `Key map id ${JSON.stringify(id)} is not a base-36 counter id, so it has no column.`
      );
    }
    const entry = keyMap[id];
    if (entry.s === undefined) {
      throw new Error(
        `Key map entry ${JSON.stringify(id)} is not in the short shape, so it has no column.`
      );
    }
    entries[position] = entry;
    idNumbers[position] = number;
    numbers.set(id, number);
    base = Math.min(base, number);
    top = Math.max(top, number);
  }

  const size = top - base + 1;
  const segment = new Array(size).fill(-1);
  const parent = new Array(size).fill(-1);
  const line = new Array(size).fill(0);
  const segments = [];
  const segmentIndexes = new Map();
  const refs = [];
  const ignoreBuildChecks = [];

  for (let position = 0; position < ids.length; position += 1) {
    const entry = entries[position];
    const index = idNumbers[position] - base;
    let segmentIndex = segmentIndexes.get(entry.s);
    if (segmentIndex === undefined) {
      segmentIndex = segments.length;
      segmentIndexes.set(entry.s, segmentIndex);
      segments.push(entry.s);
    }
    segment[index] = segmentIndex;
    const parentNumber = numbers.get(entry.p);
    if (parentNumber !== undefined) {
      parent[index] = parentNumber - base;
    }
    line[index] = entry.l ?? 0;
    if (entry.r !== undefined) {
      refs.push([index, entry.r]);
    }
    if (entry.i !== undefined) {
      ignoreBuildChecks.push([index, entry.i]);
    }
  }
  return { base, segments, segment, parent, line, refs, ignoreBuildChecks };
}

export default encodeColumnarKeyMap;
