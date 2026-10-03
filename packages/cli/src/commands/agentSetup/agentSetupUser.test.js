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

// A stand-in for Claude Code's user-scope registrations: add refuses a name
// that exists, as claude does, and failAdd(name) makes claude fail that add.
function fakeClaude({ registered = [], failAdd = () => false } = {}) {
  const names = new Set(registered);
  spawnSync.mockImplementation((command, args) => {
    if (command !== 'claude' || args[0] !== 'mcp') {
      return { status: 0, stdout: '', stderr: '' };
    }
    const name = args[4];
    if (args[1] === 'remove') {
      return names.delete(name)
        ? { status: 0, stdout: '', stderr: '' }
        : { status: 1, stdout: '', stderr: `No user-scoped MCP server named ${name}` };
    }
    if (names.has(name) || failAdd(name)) {
      return { status: 1, stdout: '', stderr: 'add failed' };
    }
    names.add(name);
    return { status: 0, stdout: '', stderr: '' };
  });
  return names;
}

test('agentSetupUser checks the pinned version, stages the new entry, replaces lowdefy, then drops the staging and lowdefy-docs registrations', async () => {
  const names = fakeClaude({ registered: ['lowdefy-docs'] });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(calls()).toEqual([
    ['npx', [...NPX_ARGS, '--help']],
    ['claude', ['--version']],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy-agent-setup']],
    ['claude', ['mcp', 'add', '--scope', 'user', 'lowdefy-agent-setup', '--', 'npx', ...NPX_ARGS]],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy']],
    ['claude', ['mcp', 'add', '--scope', 'user', 'lowdefy', '--', 'npx', ...NPX_ARGS]],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy-agent-setup']],
    ['claude', ['mcp', 'remove', '--scope', 'user', 'lowdefy-docs']],
  ]);
  expect(calls().some(([, args]) => args.includes('add-json'))).toBe(false);
  expect([...names]).toEqual(['lowdefy']);
  expect(output).toContain("Registered 'lowdefy' (lowdefy mcp 7.1.0)");
});

test('agentSetupUser replaces an existing lowdefy registration on a rerun', async () => {
  const names = fakeClaude({ registered: ['lowdefy'] });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect([...names]).toEqual(['lowdefy']);
  expect(output).toContain("Registered 'lowdefy'");
});

test('agentSetupUser registers cmd /c npx on Windows', async () => {
  setPlatform('win32');
  fakeClaude();
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(calls()).toContainEqual(['where', ['claude']]);
  const add = calls().find(([, args]) => args[1] === 'add' && args[4] === 'lowdefy');
  expect(add).toEqual([
    'claude',
    ['mcp', 'add', '--scope', 'user', 'lowdefy', '--', 'cmd', '/c', 'npx', ...NPX_ARGS],
  ]);
});

test('agentSetupUser leaves the lowdefy registration in place and prints the commands when a rerun cannot add', async () => {
  const names = fakeClaude({ registered: ['lowdefy'], failAdd: () => true });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await expect(agentSetupUser({ cliVersion: '7.1.0' })).rejects.toThrow(
    `'claude mcp add' failed:\nadd failed\nYour existing registration is unchanged. Register the server by hand with:\nclaude mcp remove --scope user lowdefy\nclaude mcp add --scope user lowdefy -- npx ${NPX_ARGS.join(
      ' '
    )}`
  );
  expect([...names]).toEqual(['lowdefy']);
});

test('agentSetupUser keeps the lowdefy-docs registration when the first migration cannot add', async () => {
  const names = fakeClaude({ registered: ['lowdefy-docs'], failAdd: () => true });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await expect(agentSetupUser({ cliVersion: '7.1.0' })).rejects.toThrow("'claude mcp add' failed");
  expect([...names]).toEqual(['lowdefy-docs']);
});

test('agentSetupUser keeps the staging registration when only the final add fails', async () => {
  const names = fakeClaude({
    registered: ['lowdefy'],
    failAdd: (name) => name === 'lowdefy',
  });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await expect(agentSetupUser({ cliVersion: '7.1.0' })).rejects.toThrow(
    `The server stays registered as 'lowdefy-agent-setup' meanwhile. Register the server by hand with:\nclaude mcp add --scope user lowdefy -- npx ${NPX_ARGS.join(
      ' '
    )}\nclaude mcp remove --scope user lowdefy-agent-setup`
  );
  expect([...names]).toEqual(['lowdefy-agent-setup']);
});

test('agentSetupUser rerun after a failed final add replaces the leftover staging registration', async () => {
  const names = fakeClaude({ registered: ['lowdefy-agent-setup'] });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect([...names]).toEqual(['lowdefy']);
  expect(output).toContain("Registered 'lowdefy'");
  expect(output).not.toContain('Could not remove the staging registration');
});

test('agentSetupUser warns with the command to run when the staging registration cannot be removed', async () => {
  const names = fakeClaude({ registered: ['lowdefy'] });
  const fake = spawnSync.getMockImplementation();
  let stagingRemoves = 0;
  spawnSync.mockImplementation((command, args) => {
    if (args[1] === 'remove' && args[4] === 'lowdefy-agent-setup' && ++stagingRemoves === 2) {
      return { status: 1, stdout: '', stderr: 'remove failed' };
    }
    return fake(command, args);
  });
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect([...names].sort()).toEqual(['lowdefy', 'lowdefy-agent-setup']);
  expect(output).toContain(
    "Could not remove the staging registration 'lowdefy-agent-setup', so sessions list the Lowdefy tools twice. Remove it with:\nclaude mcp remove --scope user lowdefy-agent-setup"
  );
  expect(output).toContain("Registered 'lowdefy'");
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
  expect(calls().filter(([command]) => command === 'claude')).toEqual([['claude', ['--version']]]);
});

test('agentSetupUser on Windows prints the server entry when where.exe cannot find claude', async () => {
  setPlatform('win32');
  spawnSync.mockImplementation((command) =>
    command === 'where'
      ? { status: 1, stdout: '', stderr: 'INFO: Could not find files for the given pattern(s).' }
      : { status: 0, stdout: '', stderr: '' }
  );
  const { default: agentSetupUser } = await import('./agentSetupUser.js');

  await agentSetupUser({ cliVersion: '7.1.0' });

  expect(output).toContain("Claude Code ('claude') is not on PATH.");
  expect(calls().some(([command]) => command === 'claude')).toBe(false);
});
