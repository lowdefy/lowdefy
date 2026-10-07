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

import path from 'path';

import describeVersionMismatch from './describeVersionMismatch.js';

test('describeVersionMismatch tells a shim installed in node_modules to move the app pin', () => {
  expect(
    describeVersionMismatch({
      cliVersion: '7.1.0',
      serverVersion: '7.2.0',
      cliDirectory: path.join('/apps', 'crm', 'node_modules', 'lowdefy'),
      appRoot: '/apps/crm',
    })
  ).toEqual(
    "lowdefy mcp is 7.1.0 but this dev server is 7.2.0, so tools and their options can differ. To match them, run `npx lowdefy agent-setup` in /apps/crm to pin lowdefy mcp to the app's Lowdefy version, then restart the agent session."
  );
});

test('describeVersionMismatch tells a shim run from a checkout to install and build it', () => {
  const cliDirectory = path.join('/no-such-checkout', 'packages', 'cli');
  expect(
    describeVersionMismatch({
      cliVersion: '7.1.0',
      serverVersion: '7.2.0',
      cliDirectory,
      appRoot: '/apps/crm',
    })
  ).toContain(`run \`pnpm install\` and \`pnpm build\` in ${cliDirectory}, then restart`);
});
