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
  // A .git directory pins project-root detection to the temp directory, so
  // tests never depend on whether os.tmpdir() has a .git ancestor.
  fs.mkdirSync(path.join(configDirectory, '.git'));
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

  const settings = JSON.parse(read(path.join('.claude', 'settings.json')));
  expect(settings).toEqual({ enabledMcpjsonServers: ['lowdefy-docs'] });

  expect(context.sendTelemetry).toHaveBeenCalled();
});

test('agentSetup enables lowdefy-docs in an existing .claude/settings.json without dropping other keys', async () => {
  const claudeDir = path.join(configDirectory, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify({ enabledMcpjsonServers: ['other-server'], model: 'sonnet' }, null, 2)
  );

  await agentSetup({ context });

  const settings = JSON.parse(read(path.join('.claude', 'settings.json')));
  expect(settings.enabledMcpjsonServers).toEqual(['other-server', 'lowdefy-docs']);
  expect(settings.model).toEqual('sonnet');
});

test('agentSetup leaves .claude/settings.json unchanged when lowdefy-docs is already enabled', async () => {
  const claudeDir = path.join(configDirectory, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeDir, 'settings.json'),
    JSON.stringify({ enabledMcpjsonServers: ['lowdefy-docs'] })
  );

  await agentSetup({ context });

  const settings = JSON.parse(read(path.join('.claude', 'settings.json')));
  expect(settings.enabledMcpjsonServers).toEqual(['lowdefy-docs']);
  expect(context.logger.info).toHaveBeenCalledWith(expect.stringContaining('already enables'));
});

test('agentSetup warns and leaves .claude/settings.json unchanged when it is not valid JSON', async () => {
  const claudeDir = path.join(configDirectory, '.claude');
  fs.mkdirSync(claudeDir, { recursive: true });
  fs.writeFileSync(path.join(claudeDir, 'settings.json'), '{ not json');

  await agentSetup({ context });

  expect(read(path.join('.claude', 'settings.json'))).toEqual('{ not json');
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("Could not parse existing '.claude/settings.json'")
  );
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

test('agentSetup leaves a matching lowdefy-docs entry in .mcp.json unchanged and notes it', async () => {
  fs.writeFileSync(
    path.join(configDirectory, '.mcp.json'),
    JSON.stringify({
      mcpServers: {
        'lowdefy-docs': { type: 'http', url: 'http://localhost:3000/lowdefy-docs/mcp' },
      },
    })
  );

  await agentSetup({ context });

  const mcpJson = JSON.parse(read('.mcp.json'));
  expect(mcpJson.mcpServers['lowdefy-docs'].url).toEqual('http://localhost:3000/lowdefy-docs/mcp');
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining("already has a 'lowdefy-docs' MCP server")
  );
});

test('agentSetup warns when an existing lowdefy-docs entry points at a different URL', async () => {
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
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("pointing at 'http://localhost:9999/lowdefy-docs/mcp'")
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

describe('monorepo layout (app in a subdirectory of the git root)', () => {
  let projectDirectory;

  beforeEach(() => {
    // Rearrange: the git root is the temp dir, the app lives in apps/myapp.
    projectDirectory = configDirectory;
    configDirectory = path.join(projectDirectory, 'apps', 'myapp');
    fs.mkdirSync(configDirectory, { recursive: true });
    context.directories.config = configDirectory;
  });

  afterEach(() => {
    // Restore so the outer afterEach removes the right directory.
    configDirectory = projectDirectory;
  });

  function readRoot(relativePath) {
    return fs.readFileSync(path.join(projectDirectory, relativePath), 'utf8');
  }

  test('agentSetup writes .mcp.json, the skill, and AGENTS.md at the project root, not the app directory', async () => {
    await agentSetup({ context });

    const mcpJson = JSON.parse(readRoot('.mcp.json'));
    expect(mcpJson.mcpServers['lowdefy-docs'].url).toEqual(
      'http://localhost:3000/lowdefy-docs/mcp'
    );
    expect(readRoot(path.join('.claude', 'skills', 'lowdefy-config', 'SKILL.md'))).toContain(
      'lives in `apps/myapp/`'
    );
    const agentsMd = readRoot('AGENTS.md');
    expect(agentsMd).toContain('Lowdefy](https://lowdefy.com) app in `apps/myapp/`');
    expect(agentsMd).toContain('cd apps/myapp && npx lowdefy dev');

    expect(fs.existsSync(path.join(configDirectory, '.mcp.json'))).toBe(false);
    expect(fs.existsSync(path.join(configDirectory, 'AGENTS.md'))).toBe(false);
    expect(fs.existsSync(path.join(configDirectory, '.claude'))).toBe(false);
  });

  test('agentSetup appends the Lowdefy section to an existing root AGENTS.md', async () => {
    fs.writeFileSync(path.join(projectDirectory, 'AGENTS.md'), '# Monorepo\n\nRoot docs.\n');

    await agentSetup({ context });

    const agentsMd = readRoot('AGENTS.md');
    expect(agentsMd).toContain('# Monorepo');
    expect(agentsMd).toContain('## Lowdefy');
    expect(fs.existsSync(path.join(projectDirectory, 'CLAUDE.md'))).toBe(false);
  });

  test('agentSetup appends the Lowdefy section to a root CLAUDE.md instead of creating AGENTS.md', async () => {
    fs.writeFileSync(path.join(projectDirectory, 'CLAUDE.md'), '# Monorepo\n\nClaude docs.\n');

    await agentSetup({ context });

    const claudeMd = readRoot('CLAUDE.md');
    expect(claudeMd).toContain('# Monorepo');
    expect(claudeMd).toContain('## Lowdefy');
    expect(fs.existsSync(path.join(projectDirectory, 'AGENTS.md'))).toBe(false);
    expect(context.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Added a 'Lowdefy' section to 'CLAUDE.md'")
    );
  });

  test('agentSetup skips the instructions file when CLAUDE.md already has a Lowdefy section', async () => {
    fs.writeFileSync(path.join(projectDirectory, 'CLAUDE.md'), '## Lowdefy\n\nCustom notes.\n');

    await agentSetup({ context });

    expect(readRoot('CLAUDE.md')).toEqual('## Lowdefy\n\nCustom notes.\n');
    expect(fs.existsSync(path.join(projectDirectory, 'AGENTS.md'))).toBe(false);
    expect(context.logger.info).toHaveBeenCalledWith(
      expect.stringContaining("'CLAUDE.md' already has a 'Lowdefy' section")
    );
  });

  test('agentSetup uses a root lockfile for the dev command', async () => {
    fs.writeFileSync(
      path.join(configDirectory, 'package.json'),
      JSON.stringify({ scripts: { dev: 'lowdefy dev' } })
    );
    fs.writeFileSync(path.join(projectDirectory, 'pnpm-lock.yaml'), '');

    await agentSetup({ context });

    expect(readRoot('AGENTS.md')).toContain('cd apps/myapp && pnpm dev');
  });

  test('agentSetup warns about a stale .mcp.json left in the app directory', async () => {
    fs.writeFileSync(path.join(configDirectory, '.mcp.json'), JSON.stringify({ mcpServers: {} }));

    await agentSetup({ context });

    expect(JSON.parse(readRoot('.mcp.json')).mcpServers['lowdefy-docs']).toBeDefined();
    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('agents launched from the project root will not discover it')
    );
  });

  test('agentSetup honors the project-directory option over git root detection', async () => {
    context.options.projectDirectory = configDirectory;

    await agentSetup({ context });

    expect(fs.existsSync(path.join(configDirectory, '.mcp.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectDirectory, '.mcp.json'))).toBe(false);
    // App is the project root, so no cd prefix and no app path mention.
    expect(fs.readFileSync(path.join(configDirectory, 'AGENTS.md'), 'utf8')).not.toContain('cd ');
  });

  test('agentSetup falls back to the config directory when project-directory does not contain it', async () => {
    context.options.projectDirectory = path.join(projectDirectory, 'apps', 'other');

    await agentSetup({ context });

    expect(context.logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not contain the config directory')
    );
    expect(fs.existsSync(path.join(configDirectory, '.mcp.json'))).toBe(true);
  });
});
