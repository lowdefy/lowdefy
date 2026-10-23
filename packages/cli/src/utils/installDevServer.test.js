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

import { vi, expect, test } from 'vitest';

const calls = [];
function mockStep(name) {
  return {
    default: vi.fn(async ({ directory, packageName }) =>
      calls.push({ name, directory, packageName })
    ),
  };
}
vi.doMock('./getServer.js', () => mockStep('getServer'));
vi.doMock('./addCustomPluginsAsDeps.js', () => mockStep('addCustomPluginsAsDeps'));
vi.doMock('./ensurePnpmWorkspaceYaml.js', () => mockStep('ensurePnpmWorkspaceYaml'));
vi.doMock('./installServer.js', () => mockStep('installServer'));

const { default: installDevServer } = await import('./installDevServer.js');

test('installDevServer fetches server-dev and installs it into the dev directory', async () => {
  await installDevServer({ context: { directories: { dev: '/app/.lowdefy/dev' } } });
  expect(calls).toEqual([
    { name: 'getServer', directory: '/app/.lowdefy/dev', packageName: '@lowdefy/server-dev' },
    { name: 'addCustomPluginsAsDeps', directory: '/app/.lowdefy/dev', packageName: undefined },
    { name: 'ensurePnpmWorkspaceYaml', directory: '/app/.lowdefy/dev', packageName: undefined },
    { name: 'installServer', directory: '/app/.lowdefy/dev', packageName: undefined },
  ]);
});
