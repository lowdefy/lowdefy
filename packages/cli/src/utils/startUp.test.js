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
import path from 'path';

jest.unstable_mockModule('./getLowdefyYaml.js', () => ({
  default: jest.fn(() =>
    Promise.resolve({ cliConfig: { cliConfig: true }, lowdefyVersion: 'lowdefyVersion' })
  ),
}));
jest.unstable_mockModule('./getCliJson.js', () => ({
  default: () => Promise.resolve({ appId: 'appId' }),
}));
jest.unstable_mockModule('@lowdefy/logger/cli', () => {
  const ui = {
    error: jest.fn(),
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    spin: jest.fn(),
    succeed: jest.fn(),
    link: jest.fn(),
  };
  const logger = { ui };
  const createCliLogger = jest.fn(() => logger);
  return {
    default: createCliLogger,
    createCliLogger,
  };
});
jest.mock('../../package.json', () => ({ version: 'cliVersion' }));
jest.unstable_mockModule('./getSendTelemetry.js', () => ({ default: () => 'sendTelemetry' }));
jest.unstable_mockModule('./validateVersion.js', () => ({
  default: jest.fn(),
}));

const command = {
  name: () => 'test',
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('startUp, options empty', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: {}, command });
  const logger = context.logger;
  expect(context).toEqual({
    appId: 'appId',
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    configDirectory: path.resolve(process.cwd()),
    directories: {
      build: path.resolve(process.cwd(), './.lowdefy/server/build'),
      config: path.resolve(process.cwd()),
      dev: path.resolve(process.cwd(), './.lowdefy/dev'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    logger,
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    pnpmCmd: context.pnpmCmd,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(logger.ui.log.mock.calls).toEqual([
    ["Running 'lowdefy test'. Lowdefy app version lowdefyVersion."],
  ]);
});

test('startUp, options undefined', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, command });
  const logger = context.logger;
  expect(context).toEqual({
    appId: 'appId',
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    configDirectory: path.resolve(process.cwd()),
    directories: {
      build: path.resolve(process.cwd(), './.lowdefy/server/build'),
      config: path.resolve(process.cwd()),
      dev: path.resolve(process.cwd(), './.lowdefy/dev'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    logger,
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    pnpmCmd: context.pnpmCmd,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(logger.ui.log.mock.calls).toEqual([
    ["Running 'lowdefy test'. Lowdefy app version lowdefyVersion."],
  ]);
});

test('startUp, options configDirectory', async () => {
  const startUp = (await import('./startUp.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: { configDirectory: './configDirectory' }, command });
  const logger = context.logger;
  expect(context).toEqual({
    appId: 'appId',
    configDirectory: path.resolve(process.cwd(), 'configDirectory'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: { configDirectory: './configDirectory' },
    directories: {
      build: path.resolve(process.cwd(), './configDirectory/.lowdefy/server/build'),
      config: path.resolve(process.cwd(), './configDirectory'),
      dev: path.resolve(process.cwd(), './configDirectory/.lowdefy/dev'),
      server: path.resolve(process.cwd(), './configDirectory/.lowdefy/server'),
    },
    logger,
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      configDirectory: './configDirectory',
    },
    pnpmCmd: context.pnpmCmd,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, no lowdefyVersion returned', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const getLowdefyYaml = (await import('./getLowdefyYaml.js')).default;
  getLowdefyYaml.mockImplementationOnce(() => ({ cliConfig: {} }));
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: {}, command });
  const logger = context.logger;
  expect(context).toEqual({
    appId: 'appId',
    configDirectory: path.resolve(process.cwd()),
    cliConfig: {},
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    directories: {
      build: path.resolve(process.cwd(), './.lowdefy/server/build'),
      config: path.resolve(process.cwd()),
      dev: path.resolve(process.cwd(), './.lowdefy/dev'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    logger,
    lowdefyVersion: undefined,
    options: {},
    pnpmCmd: context.pnpmCmd,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(logger.ui.log.mock.calls).toEqual([["Running 'lowdefy test'."]]);
});

test('startUp, requiresLowdefyYaml false with command "init"', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const getLowdefyYaml = (await import('./getLowdefyYaml.js')).default;
  getLowdefyYaml.mockImplementationOnce(() => ({ cliConfig: {} }));
  const context = { cliVersion: 'cliVersion' };
  await startUp({
    context,
    options: {},
    command: {
      name: () => 'init',
    },
  });
  const logger = context.logger;
  expect(context).toEqual({
    appId: 'appId',
    configDirectory: path.resolve(process.cwd()),
    cliConfig: {},
    cliVersion: 'cliVersion',
    command: 'init',
    commandLineOptions: {},
    directories: {
      build: path.resolve(process.cwd(), './.lowdefy/server/build'),
      config: path.resolve(process.cwd()),
      dev: path.resolve(process.cwd(), './.lowdefy/dev'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    logger,
    lowdefyVersion: undefined,
    options: {},
    pnpmCmd: context.pnpmCmd,
    requiresLowdefyYaml: false,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(logger.ui.log.mock.calls).toEqual([["Running 'lowdefy init'."]]);
});
