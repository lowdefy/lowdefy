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
import http from 'http';
import os from 'os';
import path from 'path';
import { spawn } from 'child_process';

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
  expect(settings.enabledMcpjsonServers).toEqual(['lowdefy-docs']);

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

test('agentSetup installs the framework topic skills next to lowdefy-config', async () => {
  await agentSetup({ context });

  const skillsDir = path.join(configDirectory, '.claude', 'skills');
  const names = fs.readdirSync(skillsDir).sort();
  expect(names).toHaveLength(29);
  expect(names).toContain('lowdefy-config');
  expect(names).toContain('lowdefy-list-pages');
  expect(read(path.join('.claude', 'skills', 'lowdefy-list-pages', 'SKILL.md'))).toContain(
    'name: lowdefy-list-pages'
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    "Installed 29 skills into '.claude/skills/' (0 already present)."
  );
});

test('agentSetup with --skills none writes only the lowdefy-config skill', async () => {
  context.options.skills = 'none';

  await agentSetup({ context });

  expect(fs.readdirSync(path.join(configDirectory, '.claude', 'skills'))).toEqual([
    'lowdefy-config',
  ]);
});

test('agentSetup with a --skills list writes those topics plus lowdefy-config', async () => {
  context.options.skills = 'lowdefy-list-pages,lowdefy-filters';

  await agentSetup({ context });

  expect(fs.readdirSync(path.join(configDirectory, '.claude', 'skills')).sort()).toEqual([
    'lowdefy-config',
    'lowdefy-filters',
    'lowdefy-list-pages',
  ]);
});

test('agentSetup rejects an unknown --skills name and lists the available skills', async () => {
  context.options.skills = 'lowdefy-tabels';

  await expect(agentSetup({ context })).rejects.toThrow(
    /Unknown skill "lowdefy-tabels" in --skills\. Available skills: lowdefy-aggregations, .*lowdefy-styling\. Use "all" or "none"\./
  );
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
    expect.stringContaining('already exists at version unknown - skipping.')
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

describe('hooks', () => {
  // Spawned asynchronously on purpose: the fake dev server below runs in this
  // process, so a synchronous spawn would block the event loop that has to
  // answer the hook's request.
  function runPostEditHook({ filePath, projectDirectory = configDirectory }) {
    return new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [path.join(projectDirectory, '.claude', 'hooks', 'lowdefy-build-status.mjs')],
        { env: { ...process.env, CLAUDE_PROJECT_DIR: projectDirectory } }
      );
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
      });
      child.stderr.on('data', (chunk) => {
        stderr += chunk;
      });
      child.on('close', (status) => resolve({ status, stdout, stderr }));
      child.stdin.end(
        JSON.stringify({
          hook_event_name: 'PostToolUse',
          tool_name: 'Edit',
          tool_input: { file_path: filePath },
        })
      );
    });
  }

  async function startBuildStatusServer(body) {
    const server = http.createServer((request, response) => {
      if (request.url !== '/lowdefy-docs/build-status') {
        response.writeHead(404).end();
        return;
      }
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    });
    await new Promise((resolve) => server.listen(0, resolve));
    return { server, port: server.address().port };
  }

  function writeManagerLock({ port, directory = configDirectory }) {
    const devDirectory = path.join(directory, '.lowdefy', 'dev');
    fs.mkdirSync(devDirectory, { recursive: true });
    fs.writeFileSync(
      path.join(devDirectory, '.manager.lock'),
      JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), port })
    );
  }

  test('agentSetup writes the post-edit hook script and registers it in .claude/settings.json', async () => {
    await agentSetup({ context });

    const script = read(path.join('.claude', 'hooks', 'lowdefy-build-status.mjs'));
    expect(script).toContain('build-status');
    expect(
      fs.statSync(path.join(configDirectory, '.claude', 'hooks', 'lowdefy-build-status.mjs')).mode &
        0o111
    ).toBeTruthy();

    const settings = JSON.parse(read(path.join('.claude', 'settings.json')));
    expect(settings.hooks.PostToolUse).toEqual([
      {
        matcher: 'Edit|Write|MultiEdit',
        hooks: [
          {
            type: 'command',
            command: 'node "$CLAUDE_PROJECT_DIR/.claude/hooks/lowdefy-build-status.mjs"',
            timeout: 15,
          },
        ],
      },
    ]);
  });

  test('agentSetup adds the post-edit hook without dropping existing hooks', async () => {
    const claudeDir = path.join(configDirectory, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({
        hooks: {
          PostToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo hi' }] }],
          PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'echo pre' }] }],
        },
      })
    );

    await agentSetup({ context });

    const settings = JSON.parse(read(path.join('.claude', 'settings.json')));
    expect(settings.hooks.PostToolUse).toHaveLength(2);
    expect(settings.hooks.PostToolUse[0].hooks[0].command).toEqual('echo hi');
    expect(settings.hooks.PostToolUse[1].matcher).toEqual('Edit|Write|MultiEdit');
    expect(settings.hooks.PreToolUse[0].hooks[0].command).toEqual('echo pre');
  });

  test('agentSetup is idempotent - a rerun leaves the hook script and settings unchanged', async () => {
    await agentSetup({ context });
    const settings = read(path.join('.claude', 'settings.json'));
    const script = read(path.join('.claude', 'hooks', 'lowdefy-build-status.mjs'));

    await agentSetup({ context });

    expect(read(path.join('.claude', 'settings.json'))).toEqual(settings);
    expect(read(path.join('.claude', 'hooks', 'lowdefy-build-status.mjs'))).toEqual(script);
    expect(context.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('already runs the Lowdefy post-edit hook')
    );
  });

  test('the post-edit hook exits 0 in silence when no dev server is running', async () => {
    await agentSetup({ context });

    const result = await runPostEditHook({
      filePath: path.join(configDirectory, 'pages', 'home.yaml'),
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toEqual('');
  });

  test('the post-edit hook reports build errors from the running dev server', async () => {
    await agentSetup({ context });
    const { server, port } = await startBuildStatusServer({
      build: {
        status: 'error',
        timestamp: new Date(Date.now() + 60000).toISOString(),
        errors: [
          {
            name: 'ConfigError',
            message: 'Block type "Buton" not found.',
            source: 'pages/home.yaml:12',
          },
        ],
        warnings: [],
      },
      serverErrors: [
        { timestamp: new Date().toISOString(), name: 'RequestError', message: 'getUser failed' },
      ],
      clientErrors: [],
    });
    writeManagerLock({ port });

    try {
      const result = await runPostEditHook({
        filePath: path.join(configDirectory, 'pages', 'home.yaml'),
      });
      expect(result.status).toBe(0);
      const output = JSON.parse(result.stdout);
      expect(output.hookSpecificOutput.hookEventName).toEqual('PostToolUse');
      expect(output.hookSpecificOutput.additionalContext).toContain(
        'Block type "Buton" not found.'
      );
      expect(output.hookSpecificOutput.additionalContext).toContain('pages/home.yaml:12');
      expect(output.hookSpecificOutput.additionalContext).toContain('getUser failed');
    } finally {
      server.close();
    }
  });

  test('the post-edit hook stays silent when the dev server reports a clean build', async () => {
    await agentSetup({ context });
    const { server, port } = await startBuildStatusServer({
      build: {
        status: 'ok',
        timestamp: new Date(Date.now() + 60000).toISOString(),
        errors: [],
        warnings: [],
      },
      serverErrors: [],
      clientErrors: [],
    });
    writeManagerLock({ port });

    try {
      const result = await runPostEditHook({
        filePath: path.join(configDirectory, 'pages', 'home.yaml'),
      });
      expect(result.status).toBe(0);
      expect(result.stdout).toEqual('');
    } finally {
      server.close();
    }
  });

  test('the post-edit hook ignores files outside the config directory', async () => {
    await agentSetup({ context });
    const { server, port } = await startBuildStatusServer({
      build: {
        status: 'error',
        timestamp: new Date(Date.now() + 60000).toISOString(),
        errors: [{ message: 'Broken' }],
        warnings: [],
      },
      serverErrors: [],
      clientErrors: [],
    });
    writeManagerLock({ port });

    try {
      const outside = await runPostEditHook({
        filePath: path.join(os.tmpdir(), 'somewhere-else.yaml'),
      });
      expect(outside.stdout).toEqual('');
      const buildArtifact = await runPostEditHook({
        filePath: path.join(configDirectory, '.lowdefy', 'server', 'build', 'config.json'),
      });
      expect(buildArtifact.stdout).toEqual('');
    } finally {
      server.close();
    }
  });

  test('agentSetup does not write a pre-commit hook without --git-hooks', async () => {
    await agentSetup({ context });

    expect(fs.existsSync(path.join(configDirectory, '.git', 'hooks', 'pre-commit'))).toBe(false);
    expect(
      fs.existsSync(path.join(configDirectory, '.claude', 'hooks', 'lowdefy-pre-commit.mjs'))
    ).toBe(false);
  });

  test('agentSetup --git-hooks writes the pre-commit script and .git/hooks/pre-commit', async () => {
    context.options.gitHooks = true;

    await agentSetup({ context });

    const script = read(path.join('.claude', 'hooks', 'lowdefy-pre-commit.mjs'));
    expect(script).toContain("'check', '--json'");
    expect(script).toContain('journeyIndex.json');
    expect(read(path.join('.git', 'hooks', 'pre-commit'))).toEqual(
      '#!/bin/sh\nnode .claude/hooks/lowdefy-pre-commit.mjs\n'
    );
  });

  test('agentSetup --git-hooks appends to an existing husky pre-commit instead of .git/hooks', async () => {
    context.options.gitHooks = true;
    fs.mkdirSync(path.join(configDirectory, '.husky'), { recursive: true });
    fs.writeFileSync(path.join(configDirectory, '.husky', 'pre-commit'), 'npm run lint\n');

    await agentSetup({ context });

    expect(read(path.join('.husky', 'pre-commit'))).toEqual(
      'npm run lint\nnode .claude/hooks/lowdefy-pre-commit.mjs\n'
    );
    expect(fs.existsSync(path.join(configDirectory, '.git', 'hooks', 'pre-commit'))).toBe(false);
  });

  test('agentSetup --git-hooks adds a lefthook command when the project uses lefthook', async () => {
    context.options.gitHooks = true;
    fs.writeFileSync(
      path.join(configDirectory, 'lefthook.yml'),
      '# team hooks\npre-commit:\n  commands:\n    lint:\n      run: npm run lint\n'
    );

    await agentSetup({ context });

    const lefthook = read('lefthook.yml');
    expect(lefthook).toContain('# team hooks');
    expect(lefthook).toContain('run: npm run lint');
    expect(lefthook).toContain('lowdefy:');
    expect(lefthook).toContain('run: node .claude/hooks/lowdefy-pre-commit.mjs');
  });

  test('agentSetup --git-hooks is idempotent', async () => {
    context.options.gitHooks = true;
    await agentSetup({ context });
    const preCommit = read(path.join('.git', 'hooks', 'pre-commit'));

    await agentSetup({ context });

    expect(read(path.join('.git', 'hooks', 'pre-commit'))).toEqual(preCommit);
    expect(context.logger.info).toHaveBeenCalledWith(
      expect.stringContaining('already runs the Lowdefy pre-commit hook')
    );
  });
});
