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

// Every choice is selected by default, so an empty answer selects them all. Resolves to the
// selected choices' values, or null when the input closed.
async function askMultiselect({ ask, output, message, choices }) {
  printChoices({ output, message, choices });
  while (true) {
    const answer = await ask('Enter the numbers to select, separated by commas (default: all): ');
    if (answer === null) return null;
    if (answer === '') return choices.map((choice) => choice.value);
    const indices = parseSelection({ answer, count: choices.length });
    if (indices !== null) return indices.map((index) => choices[index].value);
    output.write(`Enter numbers from 1 to ${choices.length}, for example 1,${choices.length}.\n`);
  }
}

export default askMultiselect;
