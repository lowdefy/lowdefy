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

// Parses a list of choice numbers such as "1,3" or "1 3" into zero-based indices. Returns null
// when any entry is not a choice number.
function parseSelection({ answer, count }) {
  const entries = answer.split(/[\s,]+/).filter((entry) => entry !== '');
  if (entries.length === 0) return null;
  const indices = [];
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) return null;
    const number = Number(entry);
    if (number < 1 || number > count) return null;
    if (!indices.includes(number - 1)) indices.push(number - 1);
  }
  return indices.sort((a, b) => a - b);
}

export default parseSelection;
