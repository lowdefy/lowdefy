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

import readline from 'node:readline/promises';

// Reads answers from the async line iterator rather than rl.question, which drops lines that
// arrive while no question is waiting, so answers piped in all at once still reach each prompt.
function createAsk({ input, output, onInterrupt }) {
  const rl = readline.createInterface({ input, output });
  rl.on('SIGINT', onInterrupt);
  const lines = rl[Symbol.asyncIterator]();

  // Resolves to the trimmed answer, or null once the input has closed (Ctrl+D or end of a pipe).
  async function ask(question) {
    rl.setPrompt(question);
    rl.prompt();
    const { value, done } = await lines.next();
    if (done) return null;
    return value.trim();
  }

  function close() {
    rl.close();
  }

  return { ask, close };
}

export default createAsk;
