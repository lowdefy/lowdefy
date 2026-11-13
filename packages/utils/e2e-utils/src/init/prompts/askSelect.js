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

import parseSelection from './parseSelection.js';
import printChoices from './printChoices.js';

// An empty answer selects the first choice. Resolves to the selected choice's value, or null when
// the input closed.
async function askSelect({ ask, output, message, choices }) {
  printChoices({ output, message, choices });
  while (true) {
    const answer = await ask('Enter a number (default: 1): ');
    if (answer === null) return null;
    if (answer === '') return choices[0].value;
    const indices = parseSelection({ answer, count: choices.length });
    if (indices !== null && indices.length === 1) return choices[indices[0]].value;
    output.write(`Enter one number from 1 to ${choices.length}.\n`);
  }
}

export default askSelect;
