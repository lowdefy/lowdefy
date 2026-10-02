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

import findRepository from './findRepository.js';
import trustRepository from './trustRepository.js';

// Trust comes from a person: an agent's shell tool runs commands without a
// terminal, so it cannot trust a repository in passing.
async function hubTrust({ directory = '.' }) {
  if (process.stdin.isTTY !== true) {
    throw new Error(
      '`lowdefy hub trust` only runs in an interactive terminal. Trusting a repository lets agents run its dev scripts from any session, so the user runs it in their own terminal; an agent must not run it.'
    );
  }
  const repository = findRepository({ directory });
  await trustRepository({ repository });
  process.stdout.write(
    `Trusted ${repository}: lowdefy mcp may start and query the dev servers of the apps in this repository, in any of its git worktrees, from any agent session.\n`
  );
}

export default hubTrust;
