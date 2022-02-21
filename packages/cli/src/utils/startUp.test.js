/*
  Copyright 2020-2021 Lowdefy, Inc

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

import path from 'path';
import startUp from './startUp.js';
import checkForUpdatedVersions from './checkForUpdatedVersions.js';
import createPrint from './print.js';
// eslint-disable-next-line no-unused-vars
import getLowdefyYaml from './getLowdefyYaml.js';
// eslint-disable-next-line no-unused-vars
import getCliJson from './getCliJson.js';
// eslint-disable-next-line no-unused-vars
import getSendTelemetry from './getSendTelemetry.js';
// eslint-disable-next-line no-unused-vars
import packageJson from '../../package.json';

jest.mock('./getLowdefyYaml', () =>
  jest.fn(async () =>
    Promise.resolve({ cliConfig: { cliConfig: true }, lowdefyVersion: 'lowdefyVersion' })
  )
);
jest.mock('./getCliJson', () => async () => Promise.resolve({ appId: 'appId' }));
jest.mock('./print', () => {
  const error = jest.fn();
  const log = jest.fn();
  return () => ({
    error,
    log,
  });
});
jest.mock('../../package.json', () => ({ version: 'cliVersion' }));
jest.mock('./getSendTelemetry', () => () => 'sendTelemetry');
jest.mock('./checkForUpdatedVersions', () => jest.fn(() => 'checkForUpdatedVersions'));

const print = createPrint();

const command = {
  name: () => 'test',
};

test('startUp, options empty', async () => {
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: {}, command });
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
      devServer: path.resolve(process.cwd(), './.lowdefy/dev'),
      dotLowdefy: path.resolve(process.cwd(), './.lowdefy'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
  expect(checkForUpdatedVersions).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([
    ["Running 'lowdefy test'. Lowdefy app version lowdefyVersion."],
  ]);
});

test('startUp, options undefined', async () => {
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, command });
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
      devServer: path.resolve(process.cwd(), './.lowdefy/dev'),
      dotLowdefy: path.resolve(process.cwd(), './.lowdefy'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, options configDirectory', async () => {
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: { configDirectory: './configDirectory' }, command });
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
      devServer: path.resolve(process.cwd(), './configDirectory/.lowdefy/dev'),
      dotLowdefy: path.resolve(process.cwd(), './configDirectory/.lowdefy'),
      server: path.resolve(process.cwd(), './configDirectory/.lowdefy/server'),
    },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      configDirectory: './configDirectory',
    },
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, options outputDirectory', async () => {
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: { outputDirectory: './outputDirectory' }, command });
  expect(context).toEqual({
    appId: 'appId',
    configDirectory: path.resolve(process.cwd()),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: { outputDirectory: './outputDirectory' },
    directories: {
      build: path.resolve(process.cwd(), './outputDirectory/server/build'),
      config: path.resolve(process.cwd()),
      devServer: path.resolve(process.cwd(), './outputDirectory/dev'),
      dotLowdefy: path.resolve(process.cwd(), './outputDirectory'),
      server: path.resolve(process.cwd(), './outputDirectory/server'),
    },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      outputDirectory: './outputDirectory',
    },
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, options configDirectory and outputDirectory', async () => {
  const context = { cliVersion: 'cliVersion' };
  await startUp({
    context,
    options: {
      configDirectory: './configDirectory',
      outputDirectory: './outputDirectory',
    },
    command,
  });

  expect(context).toEqual({
    appId: 'appId',
    configDirectory: path.resolve(process.cwd(), 'configDirectory'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {
      configDirectory: './configDirectory',
      outputDirectory: './outputDirectory',
    },
    directories: {
      build: path.resolve(process.cwd(), './outputDirectory/server/build'),
      config: path.resolve(process.cwd(), './configDirectory'),
      devServer: path.resolve(process.cwd(), './outputDirectory/dev'),
      dotLowdefy: path.resolve(process.cwd(), './outputDirectory'),
      server: path.resolve(process.cwd(), './outputDirectory/server'),
    },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      configDirectory: './configDirectory',
      cliConfig: true,
      outputDirectory: './outputDirectory',
    },
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, no lowdefyVersion returned', async () => {
  getLowdefyYaml.mockImplementationOnce(() => ({ cliConfig: {} }));
  const context = { cliVersion: 'cliVersion' };
  await startUp({ context, options: {}, command });
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
      devServer: path.resolve(process.cwd(), './.lowdefy/dev'),
      dotLowdefy: path.resolve(process.cwd(), './.lowdefy'),
      server: path.resolve(process.cwd(), './.lowdefy/server'),
    },
    lowdefyVersion: undefined,
    options: {},
    packageManager: 'yarn',
    print,
    sendTelemetry: 'sendTelemetry',
  });
  expect(checkForUpdatedVersions).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([["Running 'lowdefy test'."]]);
});
