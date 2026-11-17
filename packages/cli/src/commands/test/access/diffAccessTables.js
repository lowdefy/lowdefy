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

const SECTIONS = ['pages', 'endpoints'];

// Keys by code unit, as accessMatrix sorts them, so the lines read in file order.
function sortedUnion(a, b) {
  return [...new Set([...a, ...b])].sort();
}

function listCallers(rows) {
  const callers = new Set();
  Object.values(rows).forEach((cells) =>
    Object.keys(cells).forEach((caller) => callers.add(caller))
  );
  return callers;
}

// The differences between the committed access table (expected) and the build's (actual), one
// line each: a changed cell as `pages.<id>.<caller>: <old> → <new>`, an added or removed row as
// `pages.<id>: added` or `removed`, and an added or removed caller (a data set user, or none) as
// `caller <name>: added` or `removed`, once rather than once per row. An empty list means the
// tables are the same.
function diffAccessTables({ expected, actual }) {
  const expectedCallers = new Set(
    SECTIONS.flatMap((section) => [...listCallers(expected[section])])
  );
  const actualCallers = new Set(SECTIONS.flatMap((section) => [...listCallers(actual[section])]));
  const lines = [];
  sortedUnion(expectedCallers, actualCallers).forEach((caller) => {
    if (!actualCallers.has(caller)) {
      lines.push(`caller ${caller}: removed`);
    } else if (!expectedCallers.has(caller)) {
      lines.push(`caller ${caller}: added`);
    }
  });
  SECTIONS.forEach((section) => {
    const expectedRows = expected[section];
    const actualRows = actual[section];
    sortedUnion(Object.keys(expectedRows), Object.keys(actualRows)).forEach((id) => {
      if (!Object.hasOwn(actualRows, id)) {
        lines.push(`${section}.${id}: removed`);
        return;
      }
      if (!Object.hasOwn(expectedRows, id)) {
        lines.push(`${section}.${id}: added`);
        return;
      }
      sortedUnion(Object.keys(expectedRows[id]), Object.keys(actualRows[id]))
        .filter((caller) => expectedCallers.has(caller) && actualCallers.has(caller))
        .forEach((caller) => {
          const before = expectedRows[id][caller];
          const after = actualRows[id][caller];
          if (before !== after) {
            lines.push(`${section}.${id}.${caller}: ${before} → ${after}`);
          }
        });
    });
  });
  return lines;
}

export default diffAccessTables;
