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

const SOURCE_LINE = /^(.*):(\d+)$/;

// resolveConfigLocation writes the line into source as "file:line"; split it
// so a report shows the file and the line apart.
function toLocation(resolved) {
  if (resolved === null || resolved === undefined) {
    return null;
  }
  const match = SOURCE_LINE.exec(resolved.source);
  if (match === null) {
    return { source: resolved.source, line: null, config: resolved.config };
  }
  return { source: match[1], line: Number(match[2]), config: resolved.config };
}

function sameLocation(left, right) {
  if (left === null || right === null) {
    return left === right;
  }
  return left.source === right.source && left.line === right.line && left.config === right.config;
}

// Checks that two key maps say the same: both hold the same key ids, and
// every id resolves to the same source file, line and config path. Each side
// is { keyMap, refMap, resolve }, resolve being that side's own
// resolveConfigLocation, so each map is read by the reader of its own format.
// Returns { identical, missingIds (old only), extraIds (new only),
// differences: [{ id, old, new }], checked (ids resolved on both sides) }.
function compareKeyMaps({ old: before, new: after }) {
  const afterIds = new Set(Object.keys(after.keyMap));
  const missingIds = [];
  const differences = [];
  let checked = 0;

  for (const id of Object.keys(before.keyMap)) {
    if (!afterIds.delete(id)) {
      missingIds.push(id);
      continue;
    }
    const oldLocation = toLocation(
      before.resolve({ configKey: id, keyMap: before.keyMap, refMap: before.refMap })
    );
    const newLocation = toLocation(
      after.resolve({ configKey: id, keyMap: after.keyMap, refMap: after.refMap })
    );
    checked += 1;
    if (!sameLocation(oldLocation, newLocation)) {
      differences.push({ id, old: oldLocation, new: newLocation });
    }
  }
  // What is left was never in the old map.
  const extraIds = [...afterIds];

  return {
    identical: missingIds.length === 0 && extraIds.length === 0 && differences.length === 0,
    checked,
    differences,
    extraIds,
    missingIds,
  };
}

export default compareKeyMaps;
