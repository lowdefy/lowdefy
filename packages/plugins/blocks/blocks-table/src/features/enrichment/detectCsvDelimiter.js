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

const CANDIDATES = [',', ';', '\t'];

// The delimiter of a CSV file, from its first line outside quotes: the candidate (comma,
// semicolon, tab) it holds most often, comma when it holds none. Spreadsheet exports in locales
// with a decimal comma use semicolons.
function detectCsvDelimiter(text) {
  const counts = new Map(CANDIDATES.map((candidate) => [candidate, 0]));
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') quoted = !quoted;
    else if (!quoted && (char === '\n' || char === '\r')) break;
    else if (!quoted && counts.has(char)) counts.set(char, counts.get(char) + 1);
  }
  let best = ',';
  counts.forEach((count, candidate) => {
    if (count > counts.get(best)) best = candidate;
  });
  return best;
}

export default detectCsvDelimiter;
