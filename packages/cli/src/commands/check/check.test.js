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

jest.unstable_mockModule('fs', () => ({
  default: { existsSync: jest.fn() },
}));
jest.unstable_mockModule('@lowdefy/node-utils', () => ({
  readFile: jest.fn(),
}));
jest.unstable_mockModule('../../utils/getServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/resetServerPackageJson.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/addCustomPluginsAsDeps.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/ensurePnpmWorkspaceYaml.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/installServer.js', () => ({ default: jest.fn() }));
jest.unstable_mockModule('../../utils/runLowdefyCheck.js', () => ({ default: jest.fn() }));

const { default: fs } = await import('fs');
const { readFile } = await import('@lowdefy/node-utils');
const { default: getServer } = await import('../../utils/getServer.js');
const { default: installServer } = await import('../../utils/installServer.js');
const { default: runLowdefyCheck } = await import('../../utils/runLowdefyCheck.js');
const { default: check } = await import('./check.js');

const errorEntry = {
  message: 'Block type "Buton" not found.',
  name: 'ConfigError',
  source: '/app/pages/home.yaml:7',
  config: 'root.pages[0:home:Box].blocks[0:b:Buton]',
  configKey: 'a1',
  checkSlug: null,
  prodError: false,
};

function createContext({ json } = {}) {
  return {
    directories: { config: '/app', server: '/app/.lowdefy/server' },
    logger: { info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
    options: { json, logLevel: 'info' },
    pnpmCmd: 'pnpm',
    sendTelemetry: jest.fn(),
  };
}

let stdout;
let writeSpy;

beforeEach(() => {
  stdout = '';
  writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
    stdout += chunk;
    return true;
  });
  process.exitCode = undefined;
  fs.existsSync.mockReturnValue(true);
});

afterEach(() => {
  writeSpy.mockRestore();
  process.exitCode = undefined;
});

test('check exits 0 and prints No problems found for a clean report', async () => {
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  const context = createContext();
  const report = await check({ context });
  expect(report).toEqual({ errors: [], warnings: [] });
  expect(runLowdefyCheck).toHaveBeenCalledWith({ context, directory: '/app/.lowdefy/server' });
  expect(readFile).toHaveBeenCalledWith('/app/.lowdefy/server/build/checkReport.json');
  expect(stdout).toBe('No problems found.\n');
  expect(process.exitCode).toBeUndefined();
  expect(getServer).not.toHaveBeenCalled();
});

test('check sets exit code 1 and prints the grouped report when there are errors', async () => {
  readFile.mockResolvedValue(JSON.stringify({ errors: [errorEntry], warnings: [] }));
  await check({ context: createContext() });
  expect(stdout).toBe(
    [
      'pages/home.yaml',
      '     7  ConfigError: Block type "Buton" not found.',
      '',
      '1 error, 0 warnings',
      '',
    ].join('\n')
  );
  expect(process.exitCode).toBe(1);
});

test('check does not fail on warnings alone', async () => {
  readFile.mockResolvedValue(
    JSON.stringify({ errors: [], warnings: [{ ...errorEntry, name: 'ConfigWarning' }] })
  );
  await check({ context: createContext() });
  expect(stdout).toContain('0 errors, 1 warning');
  expect(process.exitCode).toBeUndefined();
});

test('check --json prints only the report object', async () => {
  const report = { errors: [errorEntry], warnings: [] };
  readFile.mockResolvedValue(JSON.stringify(report));
  await check({ context: createContext({ json: true }) });
  expect(JSON.parse(stdout)).toEqual(report);
  expect(stdout.trim().split('\n')).toHaveLength(1);
  expect(process.exitCode).toBe(1);
});

test('check prepares the server directory when its package.json is missing', async () => {
  fs.existsSync.mockReturnValue(false);
  readFile.mockResolvedValue(JSON.stringify({ errors: [], warnings: [] }));
  const context = createContext();
  await check({ context });
  expect(fs.existsSync).toHaveBeenCalledWith('/app/.lowdefy/server/package.json');
  expect(getServer).toHaveBeenCalledWith({
    context,
    packageName: '@lowdefy/server',
    directory: '/app/.lowdefy/server',
  });
  expect(installServer).toHaveBeenCalledTimes(1);
  expect(runLowdefyCheck).toHaveBeenCalledTimes(1);
});

test('check throws when the child wrote no report', async () => {
  readFile.mockResolvedValue(null);
  await expect(check({ context: createContext() })).rejects.toThrow(
    'Lowdefy check did not write a report to /app/.lowdefy/server/build/checkReport.json.'
  );
});
