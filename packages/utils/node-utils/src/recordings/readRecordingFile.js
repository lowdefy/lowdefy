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

import fs from 'fs';

// One recording file's records in line order. The dev server appends to a
// file while a tab is open, and a tab can close mid-append, so a malformed
// last line is skipped. A malformed line anywhere else is corruption, not an
// interrupted write, and throws.
function readRecordingFile({ path: filePath }) {
  const lines = fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line, index) => ({ line: line.trim(), number: index + 1 }))
    .filter(({ line }) => line !== '');
  const records = [];
  lines.forEach(({ line, number }, index) => {
    try {
      records.push(JSON.parse(line));
    } catch {
      if (index === lines.length - 1) return;
      throw new Error(`Recording file ${filePath} has a malformed line ${number}.`);
    }
  });
  return records;
}

export default readRecordingFile;
