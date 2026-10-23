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
import { expect, test } from 'vitest';

test('describeVersionMismatch tells the agent to pass the pinned agent-setup command to the developer', () => {
  expect(
    describeVersionMismatch({
      cliVersion: '7.1.0',
      serverVersion: '7.2.0',
      cliDirectory: path.join('/apps', 'crm', 'node_modules', 'lowdefy'),
      appRoot: '/apps/crm',
    })
  ).toEqual(
    "lowdefy mcp is 7.1.0 but this dev server is 7.2.0, so tools and their options can differ. Tell the developer; don't run agent-setup yourself. They fix it with `npx lowdefy@7.2.0 agent-setup` in /apps/crm, then restart the agent session."
  );
});

test('describeVersionMismatch gives the same command for a shim in the npx cache', () => {
  expect(
    describeVersionMismatch({
      cliVersion: '7.1.0',
      serverVersion: '7.2.0',
      cliDirectory: path.join('/home', '.npm', '_npx', 'abc123', 'node_modules', 'lowdefy'),
      appRoot: '/apps/crm',
    })
  ).toContain('They fix it with `npx lowdefy@7.2.0 agent-setup` in /apps/crm');
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
