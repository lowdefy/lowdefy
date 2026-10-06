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

// Reads a quoted value from `start` (just past its opening quote). posthog-js escapes a quote
// in a value as \". Returns the value and the index past its closing quote, or the end of the
// chain when the quote is never closed.
function readChainValue(chain, start) {
  let value = '';
  let index = start;
  while (index < chain.length) {
    const char = chain[index];
    if (char === '\\' && chain[index + 1] === '"') {
      value += '"';
      index += 2;
      continue;
    }
    if (char === '"') {
      return { value, end: index + 1 };
    }
    value += char;
    index += 1;
  }
  return { value, end: index };
}

export default readChainValue;
