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
import { jest } from '@jest/globals';

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
  context = { logger: { info: jest.fn(), warn: jest.fn() } };
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
