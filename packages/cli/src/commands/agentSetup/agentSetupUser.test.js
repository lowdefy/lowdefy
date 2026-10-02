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

const NPX_ARGS = ['--prefer-offline', '--yes', 'lowdefy@7.1.0', 'mcp'];
const originalPlatform = process.platform;

function setPlatform(platform) {
  Object.defineProperty(process, 'platform', { value: platform });
}

afterEach(() => {
  setPlatform(originalPlatform);
});

function calls() {
  return spawnSync.mock.calls.map(([command, args]) => [command, args]);
}

test('agentSetupUser checks the pinned version, replaces lowdefy, then drops the old lowdefy-docs registration', async () => {
  spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(calls()).toEqual([
    ['npx', [...NPX_ARGS, '--help']],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy']],
    ['claude', ['mcp', 'add', '--scope', 'user', 'lowdefy', '--', 'npx', ...NPX_ARGS]],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy-docs']],
  ]);
  expect(calls().some(([, args]) => args.includes('add-json'))).toBe(false);
  expect(output).toContain("Registered 'lowdefy' (lowdefy mcp 7.1.0)");
});

test('agentSetupUser registers cmd /c npx on Windows', async () => {
  setPlatform('win32');
  spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  const add = calls().find(([, args]) => args[1] === 'add');
  expect(add).toEqual([
    'claude',
    ['mcp', 'add', '--scope', 'user', 'lowdefy', '--', 'cmd', '/c', 'npx', ...NPX_ARGS],
  ]);
});

test('agentSetupUser keeps the lowdefy-docs registration and prints the command when the add fails', async () => {
  spawnSync.mockImplementation((command, args) =>
    args[1] === 'add'
      ? { status: 1, stdout: '', stderr: 'add failed' }
      : { status: 0, stdout: '', stderr: '' }
  );
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await expect(agentSetupUser({ cliVersion: '7.1.0' })).rejects.toThrow(
    `'claude mcp add' failed:\nadd failed\nRegister the server by hand with:\nclaude mcp add --scope user lowdefy -- npx ${NPX_ARGS.join(
      ' '
    )}`
  );
  expect(calls()).not.toContainEqual([
    'claude',
    ['mcp', 'remove', '--scope', 'user', 'lowdefy-docs'],
  ]);
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
  expect(output).toContain(JSON.stringify({ mcpServers: { lowdefy: ENTRY } }, null, 2));
});
