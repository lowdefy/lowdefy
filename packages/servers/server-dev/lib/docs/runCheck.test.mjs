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

jest.unstable_mockModule('child_process', () => ({
  execFile: jest.fn(),
}));

const { execFile } = await import('child_process');
const { default: runCheck } = await import('./runCheck.js');

const locatedError = {
  message: 'Page "nope" referenced in menu link "x" not found.',
  name: 'ConfigWarning',
  source: '/app/lowdefy.yaml:5',
  config: 'root.menus[0:default].links[0:x:MenuLink]',
  configKey: 'a',
  checkSlug: 'link-refs',
  prodError: true,
};

function mockChild({ stdout, error }) {
  execFile.mockImplementation((file, args, options, callback) => {
    if (error) {
      callback(error, { stdout: '', stderr: error.stderr ?? '' });
      return;
    }
    callback(null, { stdout, stderr: '' });
  });
}

const originalConfigDirectory = process.env.LOWDEFY_DIRECTORY_CONFIG;

beforeEach(() => {
  process.env.LOWDEFY_DIRECTORY_CONFIG = '/app';
});

afterEach(() => {
  if (originalConfigDirectory === undefined) {
    delete process.env.LOWDEFY_DIRECTORY_CONFIG;
  } else {
    process.env.LOWDEFY_DIRECTORY_CONFIG = originalConfigDirectory;
  }
});

test('runCheck runs the child in the server directory against the config directory', async () => {
  mockChild({ stdout: `${JSON.stringify({ errors: [], warnings: [] })}\n` });
  const result = await runCheck();
  expect(result).toEqual({ ok: true, errors: [], warnings: [] });
  const [file, args, options] = execFile.mock.calls[0];
  expect(file).toBe(process.execPath);
  expect(args[0]).toMatch(/runCheckChild\.js$/);
  expect(options.cwd).toBe(process.cwd());
  expect(options.env.LOWDEFY_DIRECTORY_CONFIG).toBe('/app');
  expect(options.env.LOWDEFY_DIRECTORY_SERVER).toBe(process.cwd());
});

test('runCheck returns the located errors and warnings with ok false when there are errors', async () => {
  const report = { errors: [locatedError], warnings: [{ ...locatedError, prodError: false }] };
  mockChild({ stdout: `some stray log line\n${JSON.stringify(report)}\n` });
  const result = await runCheck();
  expect(result).toEqual({ ok: false, ...report });
});

test('runCheck reports a broken check run as one unlocated internal error', async () => {
  const error = new Error('Command failed: node runCheckChild.js');
  error.stderr = 'TypeError: boom\n';
  mockChild({ error });
  const result = await runCheck();
  expect(result.ok).toBe(false);
  expect(result.warnings).toEqual([]);
  expect(result.errors).toHaveLength(1);
  expect(result.errors[0].name).toBe('LowdefyInternalError');
  expect(result.errors[0].source).toBeNull();
  expect(result.errors[0].message).toBe(
    'lowdefy check failed to run: Command failed: node runCheckChild.js\nTypeError: boom'
  );
});

test('runCheck returns a broken report when the child printed no JSON', async () => {
  mockChild({ stdout: '' });
  const report = await runCheck();
  expect(report.ok).toBe(false);
  expect(report.warnings).toEqual([]);
  expect(report.errors[0].name).toEqual('LowdefyInternalError');
  expect(report.errors[0].message).toContain('lowdefy check failed to run');
});

test('runCheck returns a broken report when the last stdout line is not JSON', async () => {
  mockChild({ stdout: 'Debugger attached.\nnot a report\n' });
  const report = await runCheck();
  expect(report.ok).toBe(false);
  expect(report.errors[0].message).toContain('lowdefy check failed to run');
});
