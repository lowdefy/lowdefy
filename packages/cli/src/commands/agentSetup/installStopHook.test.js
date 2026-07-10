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

import installStopHook from './installStopHook.js';

let projectDirectory;
let context;

beforeEach(() => {
  projectDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-install-stop-hook-test-'));
  context = {
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
  };
});

afterEach(() => {
  fs.rmSync(projectDirectory, { recursive: true, force: true });
});

function read(relativePath) {
  return fs.readFileSync(path.join(projectDirectory, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(projectDirectory, relativePath));
}

const hookRelativePath = path.join('.claude', 'hooks', 'lowdefy-feedback-stop.mjs');
const settingsRelativePath = path.join('.claude', 'settings.json');

test('installStopHook creates the hook script and settings.json when absent', async () => {
  await installStopHook({ context, projectDirectory, port: 3000 });

  const hookScript = read(hookRelativePath);
  expect(hookScript).toContain('http://localhost:3000/lowdefy-feedback/pending?consume=1');
  expect(hookScript).toContain('stop_hook_active');

  const settings = JSON.parse(read(settingsRelativePath));
  expect(settings).toEqual({
    hooks: {
      Stop: [
        {
          matcher: '',
          hooks: [{ type: 'command', command: 'node .claude/hooks/lowdefy-feedback-stop.mjs' }],
        },
      ],
    },
  });
});

test('installStopHook merges the Stop hook into an existing settings.json preserving other keys', async () => {
  fs.mkdirSync(path.join(projectDirectory, '.claude'), { recursive: true });
  fs.writeFileSync(
    path.join(projectDirectory, settingsRelativePath),
    JSON.stringify({
      otherSetting: true,
      hooks: {
        Stop: [{ matcher: '', hooks: [{ type: 'command', command: 'some-other-hook' }] }],
      },
    })
  );

  await installStopHook({ context, projectDirectory, port: 3000 });

  const settings = JSON.parse(read(settingsRelativePath));
  expect(settings.otherSetting).toBe(true);
  expect(settings.hooks.Stop).toHaveLength(2);
  expect(settings.hooks.Stop[0].hooks[0].command).toEqual('some-other-hook');
  expect(settings.hooks.Stop[1].hooks[0].command).toEqual(
    'node .claude/hooks/lowdefy-feedback-stop.mjs'
  );
});

test('installStopHook is idempotent on re-run and does not duplicate entries', async () => {
  await installStopHook({ context, projectDirectory, port: 3000 });
  await installStopHook({ context, projectDirectory, port: 3000 });

  const settings = JSON.parse(read(settingsRelativePath));
  expect(settings.hooks.Stop).toHaveLength(1);
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('already exists - skipping.')
  );
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('already has the Lowdefy feedback Stop hook')
  );
});

test('installStopHook skips the hook file when it already exists', async () => {
  fs.mkdirSync(path.join(projectDirectory, '.claude', 'hooks'), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, hookRelativePath), 'custom content');

  await installStopHook({ context, projectDirectory, port: 3000 });

  expect(read(hookRelativePath)).toEqual('custom content');
  expect(context.logger.info).toHaveBeenCalledWith(
    expect.stringContaining('already exists - skipping.')
  );
});

test('installStopHook warns and leaves settings.json unchanged when it is not valid JSON', async () => {
  fs.mkdirSync(path.join(projectDirectory, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(projectDirectory, settingsRelativePath), '{ not json');

  await installStopHook({ context, projectDirectory, port: 3000 });

  expect(read(settingsRelativePath)).toEqual('{ not json');
  expect(context.logger.warn).toHaveBeenCalledWith(expect.stringContaining('Could not parse'));
  expect(exists(hookRelativePath)).toBe(true);
});
