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

import { jest } from '@jest/globals';

const spawnSync = jest.fn();
jest.unstable_mockModule('child_process', () => ({ spawnSync }));

const ENTRY = {
  type: 'stdio',
  command: 'npx',
  args: ['--prefer-offline', '--yes', 'lowdefy@7.1.0', 'mcp'],
};

let output;

beforeEach(() => {
  spawnSync.mockReset();
  output = '';
  jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    output += chunk;
    return true;
  });
});

afterEach(() => {
  process.stdout.write.mockRestore();
});

test('agentSetupUser prefetches the pinned version and registers it as a user-scope Claude Code server', async () => {
  spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(spawnSync.mock.calls.map(([command, args]) => [command, args])).toEqual([
    ['npx', ['--prefer-offline', '--yes', 'lowdefy@7.1.0', 'mcp', '--help']],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy-docs']],
    ['claude', ['mcp', 'add-json', '--scope', 'user', 'lowdefy-docs', JSON.stringify(ENTRY)]],
  ]);
  expect(output).toContain("Registered 'lowdefy-docs' (lowdefy mcp 7.1.0)");
});

test('agentSetupUser fails before registering a version npm cannot run', async () => {
  spawnSync.mockReturnValue({ status: 1, stdout: '', stderr: "error: unknown command 'mcp'" });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await expect(agentSetupUser({ cliVersion: '6.0.0' })).rejects.toThrow(
    "Could not run 'lowdefy mcp' from lowdefy@6.0.0 on npm:\nerror: unknown command 'mcp'"
  );
  expect(spawnSync).toHaveBeenCalledTimes(1);
});

test('agentSetupUser prints the server entry when Claude Code is not installed', async () => {
  spawnSync.mockImplementation((command) =>
    command === 'claude'
      ? { error: Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' }) }
      : { status: 0, stdout: '', stderr: '' }
  );
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(output).toContain("Claude Code ('claude') is not on PATH.");
  expect(output).toContain(JSON.stringify({ mcpServers: { 'lowdefy-docs': ENTRY } }, null, 2));
});
