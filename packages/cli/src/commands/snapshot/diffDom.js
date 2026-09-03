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

import normalizeDom from './normalizeDom.js';

const MAX_DIFF_LINES = 20;

// Longest-common-subsequence alignment of two line arrays. Quadratic, so it is
// only run on the region left after the common prefix and suffix are stripped;
// a DOM change is usually local, which keeps that region small.
function alignLines({ expected, actual }) {
  const rows = expected.length;
  const cols = actual.length;
  const table = Array.from({ length: rows + 1 }, () => new Uint32Array(cols + 1));
  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = cols - 1; j >= 0; j -= 1) {
      if (expected[i] === actual[j]) {
        table[i][j] = table[i + 1][j + 1] + 1;
      } else {
        table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
  }
  const lines = [];
  let i = 0;
  let j = 0;
  while (i < rows && j < cols) {
    if (expected[i] === actual[j]) {
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      lines.push({ type: '-', line: expected[i], lineNumber: i + 1 });
      i += 1;
    } else {
      lines.push({ type: '+', line: actual[j], lineNumber: j + 1 });
      j += 1;
    }
  }
  while (i < rows) {
    lines.push({ type: '-', line: expected[i], lineNumber: i + 1 });
    i += 1;
  }
  while (j < cols) {
    lines.push({ type: '+', line: actual[j], lineNumber: j + 1 });
    j += 1;
  }
  return lines;
}

// Above this many lines on either side the LCS table is too large to build; the
// middle region is then reported positionally, which still names where the
// first change is.
const MAX_ALIGNED_LINES = 3000;

function positionalLines({ expected, actual, offset }) {
  const lines = [];
  const length = Math.max(expected.length, actual.length);
  for (let index = 0; index < length; index += 1) {
    if (index < expected.length) {
      lines.push({ type: '-', line: expected[index], lineNumber: offset + index + 1 });
    }
    if (index < actual.length) {
      lines.push({ type: '+', line: actual[index], lineNumber: offset + index + 1 });
    }
  }
  return lines;
}

// diffDom compares a golden dom.html (already normalised when it was written)
// with a freshly captured DOM, normalising the new one the same way. Returns
// { changed, lines } where lines are the first 20 differing lines as
// `-<n> golden` / `+<n> current` strings.
function diffDom({ expected, actual }) {
  const expectedLines = expected.split('\n');
  const actualLines = normalizeDom({ dom: actual }).split('\n');

  let prefix = 0;
  const minLength = Math.min(expectedLines.length, actualLines.length);
  while (prefix < minLength && expectedLines[prefix] === actualLines[prefix]) {
    prefix += 1;
  }
  let suffix = 0;
  while (
    suffix < minLength - prefix &&
    expectedLines[expectedLines.length - 1 - suffix] ===
      actualLines[actualLines.length - 1 - suffix]
  ) {
    suffix += 1;
  }
  const expectedMiddle = expectedLines.slice(prefix, expectedLines.length - suffix);
  const actualMiddle = actualLines.slice(prefix, actualLines.length - suffix);
  if (expectedMiddle.length === 0 && actualMiddle.length === 0) {
    return { changed: false, lines: [] };
  }

  let diffLines;
  if (expectedMiddle.length > MAX_ALIGNED_LINES || actualMiddle.length > MAX_ALIGNED_LINES) {
    diffLines = positionalLines({ expected: expectedMiddle, actual: actualMiddle, offset: prefix });
  } else {
    diffLines = alignLines({ expected: expectedMiddle, actual: actualMiddle }).map((entry) => ({
      ...entry,
      lineNumber: entry.lineNumber + prefix,
    }));
  }
  const total = diffLines.length;
  const lines = diffLines
    .slice(0, MAX_DIFF_LINES)
    .map(({ type, line, lineNumber }) => `${type}${lineNumber} ${line}`);
  if (total > MAX_DIFF_LINES) {
    lines.push(`... ${total - MAX_DIFF_LINES} more differing lines`);
  }
  return { changed: true, lines };
}

export default diffDom;
