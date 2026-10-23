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
import { vi, afterEach, beforeEach, expect, test } from 'vitest';

import upsertClaudeSettings from './upsertClaudeSettings.js';

let projectDirectory;
let context;

function writeSettings(fileName, value) {
  fs.mkdirSync(path.join(projectDirectory, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, '.claude', fileName), JSON.stringify(value));
}

function readSettings(fileName) {
  return JSON.parse(fs.readFileSync(path.join(projectDirectory, '.claude', fileName), 'utf8'));
}

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-claude-settings-'));
  context = { logger: { info: vi.fn(), warn: vi.fn() } };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

test('upsertClaudeSettings renames an enabled lowdefy-docs to lowdefy', async () => {
  writeSettings('settings.json', { enabledMcpjsonServers: ['lowdefy-docs', 'other'] });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({ enabledMcpjsonServers: ['lowdefy', 'other'] });
});

test('upsertClaudeSettings keeps a disabled lowdefy-docs disabled as lowdefy and does not enable it', async () => {
  writeSettings('settings.json', {
    enabledMcpjsonServers: ['other'],
    disabledMcpjsonServers: ['lowdefy-docs'],
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({
    enabledMcpjsonServers: ['other'],
    disabledMcpjsonServers: ['lowdefy'],
  });
});

test('upsertClaudeSettings migrates both lists in settings.local.json without enabling lowdefy there', async () => {
  writeSettings('settings.json', { enabledMcpjsonServers: ['lowdefy'] });
  writeSettings('settings.local.json', {
    enabledMcpjsonServers: ['mine'],
    disabledMcpjsonServers: ['lowdefy-docs', 'noisy'],
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.local.json')).toEqual({
    enabledMcpjsonServers: ['mine'],
    disabledMcpjsonServers: ['lowdefy', 'noisy'],
  });
  expect(readSettings('settings.json')).toEqual({ enabledMcpjsonServers: ['lowdefy'] });
});

test('upsertClaudeSettings renames an enabled lowdefy-docs in settings.local.json', async () => {
  writeSettings('settings.local.json', { enabledMcpjsonServers: ['lowdefy-docs'] });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.local.json')).toEqual({ enabledMcpjsonServers: ['lowdefy'] });
});

test('upsertClaudeSettings never creates settings.local.json', async () => {
  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({ enabledMcpjsonServers: ['lowdefy'] });
  expect(fs.existsSync(path.join(projectDirectory, '.claude', 'settings.local.json'))).toBe(false);
});

test('upsertClaudeSettings leaves an unparsable settings.local.json unchanged with a warning', async () => {
  fs.mkdirSync(path.join(projectDirectory, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, '.claude', 'settings.local.json'), '{ nope');

  await upsertClaudeSettings({ context, projectDirectory });

  expect(
    fs.readFileSync(path.join(projectDirectory, '.claude', 'settings.local.json'), 'utf8')
  ).toEqual('{ nope');
  expect(context.logger.warn).toHaveBeenCalledWith(
    expect.stringContaining(
      `Could not parse existing '${path.join('.claude', 'settings.local.json')}'`
    )
  );
});

test('upsertClaudeSettings leaves a settings.json that disables lowdefy unchanged', async () => {
  writeSettings('settings.json', { disabledMcpjsonServers: ['lowdefy'] });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({ disabledMcpjsonServers: ['lowdefy'] });
});

test('upsertClaudeSettings renames lowdefy-docs tool permission rules in every list', async () => {
  writeSettings('settings.local.json', {
    permissions: {
      allow: ['mcp__lowdefy-docs__lowdefy_get_schema', 'mcp__other__tool', 'Bash(ls:*)'],
      ask: ['mcp__lowdefy-docs__lowdefy_run_request'],
      deny: ['mcp__lowdefy-docs'],
      defaultMode: 'default',
    },
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.local.json')).toEqual({
    permissions: {
      allow: ['mcp__lowdefy__lowdefy_get_schema', 'mcp__other__tool', 'Bash(ls:*)'],
      ask: ['mcp__lowdefy__lowdefy_run_request'],
      deny: ['mcp__lowdefy'],
      defaultMode: 'default',
    },
  });
  expect(context.logger.info).toHaveBeenCalledWith(
    `Renamed 3 'lowdefy-docs' tool permission rules in '${path.join(
      '.claude',
      'settings.local.json'
    )}' to 'lowdefy'.`
  );
});

test('upsertClaudeSettings drops a renamed permission rule that is already there under lowdefy', async () => {
  writeSettings('settings.local.json', {
    permissions: {
      allow: ['mcp__lowdefy__lowdefy_get_doc', 'mcp__lowdefy-docs__lowdefy_get_doc'],
    },
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.local.json')).toEqual({
    permissions: { allow: ['mcp__lowdefy__lowdefy_get_doc'] },
  });
});

test('upsertClaudeSettings renames permission rules in a settings.json that already enables lowdefy', async () => {
  writeSettings('settings.json', {
    enabledMcpjsonServers: ['lowdefy'],
    permissions: { allow: ['mcp__lowdefy-docs__lowdefy_list_types'] },
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({
    enabledMcpjsonServers: ['lowdefy'],
    permissions: { allow: ['mcp__lowdefy__lowdefy_list_types'] },
  });
  expect(context.logger.info).toHaveBeenCalledWith(
    `Renamed 1 'lowdefy-docs' tool permission rule in '${path.join(
      '.claude',
      'settings.json'
    )}' to 'lowdefy'.`
  );
  expect(context.logger.info).not.toHaveBeenCalledWith(expect.stringContaining('Enabled the'));
});

test('upsertClaudeSettings leaves permission rules for other servers unchanged', async () => {
  writeSettings('settings.json', {
    enabledMcpjsonServers: ['lowdefy'],
    permissions: { allow: ['mcp__lowdefy-docs-ops__tool', 'mcp__lowdefy__lowdefy_get_doc'] },
  });

  await upsertClaudeSettings({ context, projectDirectory });

  expect(readSettings('settings.json')).toEqual({
    enabledMcpjsonServers: ['lowdefy'],
    permissions: { allow: ['mcp__lowdefy-docs-ops__tool', 'mcp__lowdefy__lowdefy_get_doc'] },
  });
});
