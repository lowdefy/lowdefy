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
import fs from 'fs';
import os from 'os';
import path from 'path';

// The pin check runs npx; no test reaches npm.
const spawnSync = jest.fn();
const childProcess = await import('child_process');
jest.unstable_mockModule('child_process', () => ({ ...childProcess, spawnSync }));

const { default: upsertMcpServer } = await import('./upsertMcpServer.js');

let projectDirectory;
let context;

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-upsert-mcp-test-'));
  spawnSync.mockReset();
  spawnSync.mockReturnValue({ status: 0, stdout: '', stderr: '' });
  context = {
    cliVersion: '7.0.3',
    directories: { config: projectDirectory },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

function readMcpJson() {
  return JSON.parse(fs.readFileSync(path.join(projectDirectory, '.mcp.json'), 'utf8'));
}

function writeMcpJson(mcpJson) {
  fs.writeFileSync(path.join(projectDirectory, '.mcp.json'), JSON.stringify(mcpJson, null, 2));
}

// A lowdefy CLI with `lowdefy mcp` installed in the app's node_modules.
function installCli(version) {
  const cliDirectory = path.join(projectDirectory, 'node_modules', 'lowdefy');
  fs.mkdirSync(path.join(cliDirectory, 'dist', 'commands', 'mcp'), { recursive: true });
  fs.writeFileSync(
    path.join(cliDirectory, 'package.json'),
    JSON.stringify({ name: 'lowdefy', version, bin: './dist/index.js' })
  );
  fs.writeFileSync(path.join(cliDirectory, 'dist', 'commands', 'mcp', 'mcp.js'), '');
}

const ENTRY = {
  type: 'stdio',
  command: 'npx',
  args: ['--prefer-offline', '--yes', 'lowdefy@7.0.3', 'mcp'],
};

test('upsertMcpServer pins the running CLI version, not the version installed in the app', async () => {
  installCli('7.0.1');

  await upsertMcpServer({ context, projectDirectory });

  expect(readMcpJson()).toEqual({ mcpServers: { lowdefy: ENTRY } });
  expect(context.logger.warn).not.toHaveBeenCalled();
});

test('upsertMcpServer checks that npm can run the pinned lowdefy mcp before writing', async () => {
  await upsertMcpServer({ context, projectDirectory });

  expect(spawnSync.mock.calls.map(([command, args]) => [command, args])).toEqual([
    ['npx', ['--prefer-offline', '--yes', 'lowdefy@7.0.3', 'mcp', '--help']],
  ]);
});

test('upsertMcpServer refuses a version npm cannot run and writes no .mcp.json', async () => {
  spawnSync.mockReturnValue({ status: 1, stdout: '', stderr: 'npm error 404 lowdefy@7.0.3' });

  await expect(upsertMcpServer({ context, projectDirectory })).rejects.toThrow(
    "Could not run 'lowdefy mcp' from lowdefy@7.0.3 on npm:\nnpm error 404 lowdefy@7.0.3"
  );
  await expect(upsertMcpServer({ context, projectDirectory })).rejects.toThrow(
    'It pins the version of the CLI running agent-setup (7.0.3), which must be published on npm'
  );
  await expect(upsertMcpServer({ context, projectDirectory })).rejects.toThrow(
    /claude mcp add --scope local lowdefy -- node \S+index\.js mcp/
  );
  expect(fs.existsSync(path.join(projectDirectory, '.mcp.json'))).toBe(false);
});

test('upsertMcpServer leaves an existing .mcp.json as it was when the version is refused', async () => {
  const existing = JSON.stringify({ mcpServers: { other: { command: 'other-server' } } });
  fs.writeFileSync(path.join(projectDirectory, '.mcp.json'), existing);
  spawnSync.mockReturnValue({ status: 1, stdout: '', stderr: 'npm error 404' });

  await expect(upsertMcpServer({ context, projectDirectory })).rejects.toThrow(
    "'.mcp.json' was not written"
  );
  expect(fs.readFileSync(path.join(projectDirectory, '.mcp.json'), 'utf8')).toEqual(existing);
});

test('upsertMcpServer leaves a lowdefy-docs entry untouched and adds lowdefy beside it', async () => {
  const docs = {
    type: 'stdio',
    command: 'npx',
    args: ['--prefer-offline', '--yes', 'lowdefy@7.0.1', 'mcp'],
  };
  writeMcpJson({ mcpServers: { 'lowdefy-docs': docs } });

  await upsertMcpServer({ context, projectDirectory });

  expect(readMcpJson()).toEqual({ mcpServers: { 'lowdefy-docs': docs, lowdefy: ENTRY } });
  expect(context.logger.info).toHaveBeenCalledWith(
    "Added the 'lowdefy' MCP server to '.mcp.json'."
  );
});

test('upsertMcpServer keeps other servers and removes port-pinned Lowdefy servers', async () => {
  const staging = { type: 'http', url: 'https://staging.example.com/api/mcp' };
  writeMcpJson({
    mcpServers: {
      'lowdefy-3010': { type: 'http', url: 'http://localhost:3010/lowdefy-docs/mcp' },
      staging,
    },
  });

  await upsertMcpServer({ context, projectDirectory });

  expect(readMcpJson()).toEqual({ mcpServers: { staging, lowdefy: ENTRY } });
  expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('lowdefy-3010'));
});

test('upsertMcpServer moves a lowdefy entry pinned to another version and names the change', async () => {
  writeMcpJson({
    mcpServers: {
      lowdefy: {
        type: 'stdio',
        command: 'npx',
        args: ['--prefer-offline', '--yes', 'lowdefy@7.0.1', 'mcp'],
      },
    },
  });

  await upsertMcpServer({ context, projectDirectory });

  expect(readMcpJson().mcpServers.lowdefy).toEqual(ENTRY);
  expect(context.logger.info).toHaveBeenCalledWith(
    "Updated the 'lowdefy' MCP server in '.mcp.json'."
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining(
      "Its command changed from 'npx --prefer-offline --yes lowdefy@7.0.1 mcp' to 'npx --prefer-offline --yes lowdefy@7.0.3 mcp'"
    )
  );
});

test('upsertMcpServer leaves an entry that already pins the running CLI unchanged', async () => {
  writeMcpJson({ mcpServers: { lowdefy: ENTRY } });

  await upsertMcpServer({ context, projectDirectory });

  expect(readMcpJson()).toEqual({ mcpServers: { lowdefy: ENTRY } });
  expect(context.logger.info).toHaveBeenCalledWith(
    "'.mcp.json' already runs 'lowdefy mcp' as 'lowdefy' - leaving it unchanged."
  );
});

test('upsertMcpServer leaves a .mcp.json that does not parse alone', async () => {
  fs.writeFileSync(path.join(projectDirectory, '.mcp.json'), '{ not json');

  await upsertMcpServer({ context, projectDirectory });

  expect(fs.readFileSync(path.join(projectDirectory, '.mcp.json'), 'utf8')).toEqual('{ not json');
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("Could not parse existing '.mcp.json'")
  );
});
