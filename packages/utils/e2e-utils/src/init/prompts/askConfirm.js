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

// An empty answer takes the initial value. Resolves to true or false, or null when the input
// closed.
async function askConfirm({ ask, output, message, initial }) {
  const hint = initial ? '(Y/n)' : '(y/N)';
  while (true) {
    const answer = await ask(`${message} ${hint} `);
    if (answer === null) return null;
    if (answer === '') return initial;
    const normalized = answer.toLowerCase();
    if (normalized === 'y' || normalized === 'yes') return true;
    if (normalized === 'n' || normalized === 'no') return false;
    output.write('Enter y or n.\n');
  }
}

export default askConfirm;
