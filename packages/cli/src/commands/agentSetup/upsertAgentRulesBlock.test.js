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

import agentsMd from './agentsMd.js';
import upsertAgentRulesBlock from './upsertAgentRulesBlock.js';

const skills = [{ name: 'test-skill', render: () => '', agentsMdLine: '`test-skill`: a test.' }];

let projectDirectory;
let context;

function block(version) {
  return `<!-- BEGIN:lowdefy-agent-rules version=${version} -->\n${agentsMd({
    skills,
  }).trimEnd()}\n<!-- END:lowdefy-agent-rules -->\n`;
}

function read(fileName) {
  return fs.readFileSync(path.join(projectDirectory, fileName), 'utf8');
}

function write(fileName, content) {
  fs.mkdirSync(path.dirname(path.join(projectDirectory, fileName)), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, fileName), content);
}

function exists(fileName) {
  return fs.existsSync(path.join(projectDirectory, fileName));
}

async function run(cliVersion = '7.0.0') {
  await upsertAgentRulesBlock({ context: { ...context, cliVersion }, projectDirectory, skills });
}

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-agent-rules-test-'));
  context = { logger: { info: jest.fn(), warn: jest.fn() } };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

test('with no instructions files, writes AGENTS.md holding only the block and a CLAUDE.md importing it', async () => {
  await run();
  expect(read('AGENTS.md')).toEqual(block('7.0.0'));
  expect(read('CLAUDE.md')).toEqual('@AGENTS.md\n');
  expect(context.logger.info).toHaveBeenCalledWith("Created 'AGENTS.md'.");
  expect(context.logger.info).toHaveBeenCalledWith("Created 'CLAUDE.md' importing 'AGENTS.md'.");
});

test('appends the block after the text of an existing AGENTS.md, and a rerun replaces only the block', async () => {
  write('AGENTS.md', '# Project\n\nOur rules.\n');
  write('CLAUDE.md', '@AGENTS.md\n');
  await run('7.0.0');
  expect(read('AGENTS.md')).toEqual(`# Project\n\nOur rules.\n\n${block('7.0.0')}`);

  write('AGENTS.md', `${read('AGENTS.md')}\n## After\n\nMore rules.\n`);
  await run('7.1.0');
  expect(read('AGENTS.md')).toEqual(
    `# Project\n\nOur rules.\n\n${block('7.1.0')}\n## After\n\nMore rules.\n`
  );
  expect(context.logger.info).toHaveBeenCalledWith("Updated the Lowdefy block in 'AGENTS.md'.");
});

test('with only a CLAUDE.md, appends the block there, creating no AGENTS.md and adding no import', async () => {
  write('CLAUDE.md', '# Claude rules\n');
  await run();
  expect(read('CLAUDE.md')).toEqual(`# Claude rules\n\n${block('7.0.0')}`);
  expect(exists('AGENTS.md')).toBe(false);
});

test('replaces the block in CLAUDE.md when CLAUDE.md holds it and AGENTS.md exists too', async () => {
  write('AGENTS.md', '# Agents\n');
  write('CLAUDE.md', `# Claude\n\n${block('6.0.0')}`);
  await run();
  expect(read('CLAUDE.md')).toEqual(`# Claude\n\n${block('7.0.0')}`);
  expect(read('AGENTS.md')).toEqual('# Agents\n');
});

test('adds @AGENTS.md to the top of a root CLAUDE.md that lacks it, once', async () => {
  write('AGENTS.md', '# Agents\n');
  write('CLAUDE.md', '# Claude\n\nClaude only.\n');
  await run();
  expect(read('CLAUDE.md')).toEqual('@AGENTS.md\n\n# Claude\n\nClaude only.\n');
  expect(context.logger.info).toHaveBeenCalledWith(
    "Added '@AGENTS.md' to the top of 'CLAUDE.md' so Claude Code reads it."
  );
  await run();
  expect(read('CLAUDE.md')).toEqual('@AGENTS.md\n\n# Claude\n\nClaude only.\n');
});

test('accepts an @AGENTS.md line anywhere in CLAUDE.md, with surrounding whitespace', async () => {
  write('AGENTS.md', '# Agents\n');
  write('CLAUDE.md', '# Claude\n\n  @AGENTS.md  \n');
  await run();
  expect(read('CLAUDE.md')).toEqual('# Claude\n\n  @AGENTS.md  \n');
});

test('never reads or edits .claude/CLAUDE.md or CLAUDE.local.md', async () => {
  write('.claude/CLAUDE.md', '# Nested Claude rules\n');
  write('CLAUDE.local.md', '# Personal\n');
  await run();
  expect(read('.claude/CLAUDE.md')).toEqual('# Nested Claude rules\n');
  expect(read('CLAUDE.local.md')).toEqual('# Personal\n');
  expect(read('CLAUDE.md')).toEqual('@AGENTS.md\n');
});

test('leaves a file whose BEGIN marker has no END marker unchanged, and warns', async () => {
  const broken = '# Project\n\n<!-- BEGIN:lowdefy-agent-rules version=6.0.0 -->\nHalf a block.\n';
  write('AGENTS.md', broken);
  await run();
  expect(read('AGENTS.md')).toEqual(broken);
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining("has a 'BEGIN:lowdefy-agent-rules' marker with no")
  );
});

test('notes a block that is already current', async () => {
  await run();
  context.logger.info.mockClear();
  await run();
  expect(read('AGENTS.md')).toEqual(block('7.0.0'));
  expect(context.logger.info).toHaveBeenCalledWith(
    "The Lowdefy block in 'AGENTS.md' is up to date."
  );
});
