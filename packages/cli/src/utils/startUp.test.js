/*
  Copyright 2020-2024 Lowdefy, Inc

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
jest.unstable_mockModule('./createPrint.js', () => ({
  default: () => ({
    error: jest.fn(),
    log: jest.fn(),
  }),
}));
jest.mock('../../package.json', () => ({ version: 'cliVersion' }));
jest.unstable_mockModule('./getSendTelemetry.js', () => ({ default: () => 'sendTelemetry' }));
jest.unstable_mockModule('./validateVersion.js', () => ({
  default: jest.fn(),
}));

const command = {
  name: () => 'test',
};

test('startUp, options empty', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: {}, command });
  const print = context.print;
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
    license: {
      code: 'NO_LICENSE',
      entitlements: [],
      id: 'NO_LICENSE',
      metadata: {},
      timestamp: context.license.timestamp,
    },
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    pnpmCmd: context.pnpmCmd,
    print,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print).toMatchInlineSnapshot(`
  Object {
    "error": [MockFunction],
    "log": [MockFunction] {
      "calls": Array [
        Array [
          "Running 'lowdefy test'. Lowdefy app version lowdefyVersion.",
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": undefined,
        },
      ],
    },
  }
`);
});

test('startUp, options undefined', async () => {
  const startUp = (await import('./startUp.js')).default;
  const validateVersion = (await import('./validateVersion.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, command });
  const print = context.print;
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
    license: {
      code: 'NO_LICENSE',
      entitlements: [],
      id: 'NO_LICENSE',
      metadata: {},
      timestamp: context.license.timestamp,
    },
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    pnpmCmd: context.pnpmCmd,
    print,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print).toMatchInlineSnapshot(`
    Object {
      "error": [MockFunction],
      "log": [MockFunction] {
        "calls": Array [
          Array [
            "Running 'lowdefy test'. Lowdefy app version lowdefyVersion.",
          ],
        ],
        "results": Array [
          Object {
            "type": "return",
            "value": undefined,
          },
        ],
      },
    }
  `);
});

test('startUp, options configDirectory', async () => {
  const startUp = (await import('./startUp.js')).default;
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: { configDirectory: './configDirectory' }, command });
  const print = context.print;
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
    license: {
      code: 'NO_LICENSE',
      entitlements: [],
      id: 'NO_LICENSE',
      metadata: {},
      timestamp: context.license.timestamp,
    },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      configDirectory: './configDirectory',
    },
    pnpmCmd: context.pnpmCmd,
    print,
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
  const print = context.print;
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
    license: {
      code: 'NO_LICENSE',
      entitlements: [],
      id: 'NO_LICENSE',
      metadata: {},
      timestamp: context.license.timestamp,
    },
    lowdefyVersion: undefined,
    options: {},
    pnpmCmd: context.pnpmCmd,
    print,
    requiresLowdefyYaml: true,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([["Running 'lowdefy test'."]]);
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
  const print = context.print;
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
    license: {
      code: 'NO_LICENSE',
      entitlements: [],
      id: 'NO_LICENSE',
      metadata: {},
      timestamp: context.license.timestamp,
    },
    lowdefyVersion: undefined,
    options: {},
    pnpmCmd: context.pnpmCmd,
    print,
    requiresLowdefyYaml: false,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([["Running 'lowdefy init'."]]);
});
