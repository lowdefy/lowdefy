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

// `- _js: |` puts the key two columns right of the dash, so the column a nested
// line must beat is the key's own column, not the line's indentation.
const keyLine = /^(\s*)((?:-\s+)*)([A-Za-z_][\w.$]*)\s*:(\s|$)/;

function indentationOf(line) {
  return line.length - line.trimStart().length;
}

// Every occurrence of one of `keys` as a mapping key, with the half-open line
// range [startIndex, endIndex) it owns: the key line plus every line below it
// indented past the key's column. A blank line is charged to the block only
// when a deeper-indented line follows it, so the blank line separating two
// sections belongs to neither.
function findBlocks({ lines, keys }) {
  const blocks = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = keyLine.exec(lines[index]);
    if (match === null || !keys.includes(match[3])) {
      continue;
    }
    const column = match[1].length + match[2].length;
    let endIndex = index + 1;
    for (let next = index + 1; next < lines.length; next += 1) {
      if (lines[next].trim() === '') {
        continue;
      }
      if (indentationOf(lines[next]) <= column) {
        break;
      }
      endIndex = next + 1;
    }
    blocks.push({ key: match[3], startIndex: index, endIndex, column });
  }
  return blocks;
}

export default findBlocks;
