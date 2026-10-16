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

import fs from 'fs';
import os from 'os';
import path from 'path';

import checkAgentFiles from './checkAgentFiles.js';

let root;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-agent-files-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

function write(relativePath, text) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, text);
}

function block(version) {
  const attribute = version ? ` version=${version}` : '';
  return `# Project\n\n<!-- BEGIN:lowdefy-agent-rules${attribute} -->\n## Lowdefy\n<!-- END:lowdefy-agent-rules -->\n`;
}

// A git checkout with the app at its root, AGENTS.md holding the block and
// CLAUDE.md importing it.
function checkout({ version = '7.1.4' } = {}) {
  fs.mkdirSync(path.join(root, '.git'));
  write('AGENTS.md', block(version));
  write('CLAUDE.md', '@AGENTS.md\n');
}

const check = (lowdefyVersion, configDirectory = root) =>
  checkAgentFiles({ configDirectory, lowdefyVersion });

describe('version', () => {
  test('a patch difference is no notice', () => {
    checkout({ version: '7.1.4' });
    expect(check('7.1.0')).toEqual([]);
  });

  test('a minor difference is a version_mismatch with the fix', () => {
    checkout({ version: '7.0.3' });
    expect(check('7.1.0')).toEqual([
      {
        code: 'version_mismatch',
        message:
          "Agent instructions are from Lowdefy 7.0.3, this app runs 7.1.0, so some of their guidance may not apply. Tell the developer; don't run agent-setup yourself. They fix it with `npx lowdefy@7.1.0 agent-setup`, unless another app in this repository runs a different version.",
      },
    ]);
  });

  test('a marker without a version is a version_mismatch from an unknown version', () => {
    checkout({ version: null });
    const notices = check('7.1.0');
    expect(notices).toHaveLength(1);
    expect(notices[0].code).toBe('version_mismatch');
    expect(notices[0].message).toMatch(/^Agent instructions are from an unknown Lowdefy version, /);
  });

  test('an app on local is not version-checked', () => {
    checkout({ version: '6.0.0' });
    expect(check('local')).toEqual([]);
  });

  test('no notices when the app version cannot be read', () => {
    checkout({ version: '6.0.0' });
    expect(check(null)).toEqual([]);
  });
});

describe('Claude import', () => {
  test('block in AGENTS.md and no root CLAUDE.md is claude_import_missing', () => {
    checkout();
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    expect(check('7.1.0')).toEqual([
      {
        code: 'claude_import_missing',
        message:
          'Claude Code may not read AGENTS.md. Tell the developer: add `@AGENTS.md` to the top of CLAUDE.md, or run agent-setup.',
      },
    ]);
  });

  test('the import on any line of the root CLAUDE.md counts', () => {
    checkout();
    write('CLAUDE.md', '# Notes\n\n  @AGENTS.md  \nMore.\n');
    expect(check('7.1.0')).toEqual([]);
  });

  test('a line that only mentions @AGENTS.md is not the import', () => {
    checkout();
    write('CLAUDE.md', 'See @AGENTS.md for rules.\n');
    expect(check('7.1.0').map((notice) => notice.code)).toEqual(['claude_import_missing']);
  });

  test('only .claude/CLAUDE.md importing it is claude_import_missing', () => {
    checkout();
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    write('.claude/CLAUDE.md', '@AGENTS.md\n');
    expect(check('7.1.0').map((notice) => notice.code)).toEqual(['claude_import_missing']);
  });

  test('block in CLAUDE.md needs no import', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('CLAUDE.md', block('7.1.0'));
    expect(check('7.1.0')).toEqual([]);
  });

  test('applies to an app on local', () => {
    checkout();
    fs.rmSync(path.join(root, 'CLAUDE.md'));
    expect(check('local').map((notice) => notice.code)).toEqual(['claude_import_missing']);
  });
});

describe('finding the block', () => {
  test('a block in the app folder below the git root is found', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('CLAUDE.md', '@AGENTS.md\n');
    write('.mcp.json', JSON.stringify({ mcpServers: { lowdefy: {} } }));
    write('apps/web/AGENTS.md', block('7.0.0'));
    expect(check('7.1.0', path.join(root, 'apps/web')).map((notice) => notice.code)).toEqual([
      'version_mismatch',
    ]);
  });

  test('the nearest block wins, AGENTS.md before CLAUDE.md', () => {
    checkout({ version: '6.0.0' });
    write('apps/web/CLAUDE.md', block('7.1.0'));
    write('apps/web/AGENTS.md', 'No block here.\n');
    expect(check('7.1.0', path.join(root, 'apps/web'))).toEqual([]);
  });

  test('a nested worktree never reads the outer checkout', () => {
    checkout({ version: '6.0.0' });
    write('.mcp.json', JSON.stringify({ mcpServers: { lowdefy: {} } }));
    write('worktrees/feature/.git', 'gitdir: ../../.git/worktrees/feature\n');
    write('worktrees/feature/app/lowdefy.yaml', 'lowdefy: 7.1.0\n');
    expect(check('7.1.0', path.join(root, 'worktrees/feature/app'))).toEqual([]);
  });

  test('outside git, only the config directory is read', () => {
    write('AGENTS.md', block('6.0.0'));
    fs.mkdirSync(path.join(root, 'app'));
    expect(check('7.1.0', path.join(root, 'app'))).toEqual([]);
  });
});

describe('missing block', () => {
  test('.mcp.json naming the lowdefy server is block_missing', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('.mcp.json', JSON.stringify({ mcpServers: { lowdefy: { command: 'npx' } } }));
    expect(check('7.1.0')).toEqual([
      {
        code: 'block_missing',
        message:
          "Lowdefy's agent instructions are missing from AGENTS.md. Tell the developer; don't run agent-setup yourself. They add them with `npx lowdefy@7.1.0 agent-setup`.",
      },
    ]);
  });

  test('no .mcp.json is no notice', () => {
    fs.mkdirSync(path.join(root, '.git'));
    expect(check('7.1.0')).toEqual([]);
  });

  test('.mcp.json with only other servers is no notice', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('.mcp.json', JSON.stringify({ mcpServers: { other: {} } }));
    expect(check('7.1.0')).toEqual([]);
  });

  test('an unparsable .mcp.json is no notice', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('.mcp.json', '{ not json');
    expect(check('7.1.0')).toEqual([]);
  });

  test('an app on local is no notice', () => {
    fs.mkdirSync(path.join(root, '.git'));
    write('.mcp.json', JSON.stringify({ mcpServers: { lowdefy: {} } }));
    expect(check('local')).toEqual([]);
  });
});

test('never writes a file', () => {
  fs.mkdirSync(path.join(root, '.git'));
  write('AGENTS.md', block('6.0.0'));
  write('.mcp.json', JSON.stringify({ mcpServers: { lowdefy: {} } }));
  const before = fs.readdirSync(root).sort();
  check('7.1.0');
  expect(fs.readdirSync(root).sort()).toEqual(before);
  expect(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')).toBe(block('6.0.0'));
});
