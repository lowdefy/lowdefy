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

import agentSetup from './agentSetup.js';

let configDirectory;
let context;

beforeEach(() => {
  configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-agent-setup-test-'));
  context = {
    directories: { config: configDirectory },
    options: { port: 3000 },
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
    sendTelemetry: jest.fn(),
  };
});

afterEach(() => {
  fs.rmSync(configDirectory, { recursive: true, force: true });
});

function read(relativePath) {
  return fs.readFileSync(path.join(configDirectory, relativePath), 'utf8');
}

test('agentSetup creates .mcp.json, the Claude Code skill, and AGENTS.md from scratch', async () => {
  await agentSetup({ context });

  const mcpJson = JSON.parse(read('.mcp.json'));
  expect(mcpJson).toEqual({
    mcpServers: {
      'lowdefy-docs': { type: 'http', url: 'http://localhost:3000/lowdefy-docs/mcp' },
    },
  });

  const skillMd = read(path.join('.claude', 'skills', 'lowdefy-config', 'SKILL.md'));
  expect(skillMd).toContain('name: lowdefy-config');
  expect(skillMd).toContain('http://localhost:3000/lowdefy-docs');
  expect(skillMd).toContain('Never guess type names or properties.');

  const agentsMd = read('AGENTS.md');
  expect(agentsMd).toContain('## Lowdefy');
  expect(agentsMd).toContain('npx lowdefy dev');
  expect(agentsMd).toContain('http://localhost:3000/lowdefy-docs');

  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('agentSetup uses the port option to parameterize the generated URLs', async () => {
  context.options.port = 4123;

  await agentSetup({ context });

  const mcpJson = JSON.parse(read('.mcp.json'));
  expect(mcpJson.mcpServers['lowdefy-docs'].url).toEqual('http://localhost:4123/lowdefy-docs/mcp');
  expect(read('AGENTS.md')).toContain('http://localhost:4123/lowdefy-docs');
});

test('agentSetup merges the lowdefy-docs server into an existing .mcp.json', async () => {
  fs.writeFileSync(
    path.join(configDirectory, '.mcp.json'),
    JSON.stringify({ mcpServers: { other: { type: 'stdio', command: 'other-server' } } }, null, 2)
  );

  await agentSetup({ context });

  const mcpJson = JSON.parse(read('.mcp.json'));
  expect(mcpJson.mcpServers.other).toEqual({ type: 'stdio', command: 'other-server' });
  expect(mcpJson.mcpServers['lowdefy-docs']).toEqual({
    type: 'http',
    url: 'http://localhost:3000/lowdefy-docs/mcp',
  });
});

test('agentSetup leaves an existing lowdefy-docs entry in .mcp.json unchanged and notes it', async () => {
  fs.writeFileSync(
    path.join(configDirectory, '.mcp.json'),
    JSON.stringify({
      mcpServers: {
        'lowdefy-docs': { type: 'http', url: 'http://localhost:9999/lowdefy-docs/mcp' },
      },
    })
  );

  await agentSetup({ context });

  const mcpJson = JSON.parse(read('.mcp.json'));
  expect(mcpJson.mcpServers['lowdefy-docs'].url).toEqual('http://localhost:9999/lowdefy-docs/mcp');
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining("already has a 'lowdefy-docs' MCP server")
  );
});

test('agentSetup warns and leaves .mcp.json unchanged when it is not valid JSON', async () => {
  fs.writeFileSync(path.join(configDirectory, '.mcp.json'), '{ not json');

  await agentSetup({ context });

  expect(read('.mcp.json')).toEqual('{ not json');
  expect(context.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not parse'));
});

test('agentSetup skips the skill file when it already exists', async () => {
  const skillDir = path.join(configDirectory, '.claude', 'skills', 'lowdefy-config');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), 'custom content');

  await agentSetup({ context });

  expect(read(path.join('.claude', 'skills', 'lowdefy-config', 'SKILL.md'))).toEqual(
    'custom content'
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('already exists - skipping.')
  );
});

test('agentSetup appends a Lowdefy section to an existing AGENTS.md', async () => {
  fs.writeFileSync(path.join(configDirectory, 'AGENTS.md'), '# My Project\n\nSome instructions.\n');

  await agentSetup({ context });

  const agentsMd = read('AGENTS.md');
  expect(agentsMd).toContain('# My Project');
  expect(agentsMd).toContain('Some instructions.');
  expect(agentsMd).toContain('## Lowdefy');
});

test('agentSetup skips AGENTS.md when a Lowdefy section already exists', async () => {
  fs.writeFileSync(
    path.join(configDirectory, 'AGENTS.md'),
    '# My Project\n\n## Lowdefy\n\nCustom lowdefy notes.\n'
  );

  await agentSetup({ context });

  expect(read('AGENTS.md')).toEqual('# My Project\n\n## Lowdefy\n\nCustom lowdefy notes.\n');
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining("already has a 'Lowdefy' section")
  );
});

test('agentSetup prefers a package.json dev script that runs lowdefy dev', async () => {
  fs.writeFileSync(
    path.join(configDirectory, 'package.json'),
    JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
  );
  fs.writeFileSync(path.join(configDirectory, 'pnpm-lock.yaml'), '');

  await agentSetup({ context });

  expect(read('AGENTS.md')).toContain('pnpm dev');
});
