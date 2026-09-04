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

// A declared index serves a candidate when the candidate's equality fields are
// the index's leading keys - in any order, because equality bounds do not care
// about key order - and the candidate's sort follows them in the index's own
// order. A longer index still covers: a query on { a } is served by an index
// on { a, b }, which is the prefix rule. Range fields are deliberately not
// required: a range is the last thing an index can help with and an index that
// stops before it is still the right index.
function indexCovers({ index, candidate }) {
  const indexKeys = Object.keys(index.keys ?? {}).filter((key) => !key.startsWith('~'));
  const equality = new Set(candidate.equality.map((key) => key.field));
  let position = 0;
  while (position < indexKeys.length && equality.has(indexKeys[position])) {
    equality.delete(indexKeys[position]);
    position += 1;
  }
  if (equality.size > 0) return false;
  for (const key of candidate.sort) {
    if (indexKeys[position] !== key.field) return false;
    position += 1;
  }
  if (candidate.equality.length === 0 && candidate.sort.length === 0) {
    return candidate.range.some((key) => key.field === indexKeys[0]);
  }
  return true;
}

export default indexCovers;
