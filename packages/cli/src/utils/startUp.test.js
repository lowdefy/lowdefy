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
import startUp from './startUp';
import validateVersion from './validateVersion';
import createPrint from './print';
// eslint-disable-next-line no-unused-vars
import getLowdefyYaml from './getLowdefyYaml';
// eslint-disable-next-line no-unused-vars
import getCliJson from './getCliJson';
// eslint-disable-next-line no-unused-vars
import getSendTelemetry from './getSendTelemetry';
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
jest.mock('./validateVersion', () => jest.fn(() => 'validateVersion'));

const print = createPrint();

const command = {
  name: () => 'test',
};

test('startUp, options empty', async () => {
  const context = {};
  await startUp({ context, options: {}, command });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    print,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([
    ["Running 'lowdefy test'. Lowdefy app version lowdefyVersion."],
  ]);
});

test('startUp, options undefined', async () => {
  const context = {};
  await startUp({ context, command });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    lowdefyVersion: 'lowdefyVersion',
    options: { cliConfig: true },
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    print,
    sendTelemetry: 'sendTelemetry',
  });
});

test('startUp, options baseDirectory', async () => {
  const context = {};
  await startUp({ context, options: { baseDirectory: './baseDirectory' }, command });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: { baseDirectory: './baseDirectory' },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      baseDirectory: './baseDirectory',
    },
    outputDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/build'),
    sendTelemetry: 'sendTelemetry',
    print,
  });
});

test('startUp, options outputDirectory', async () => {
  const context = {};
  await startUp({ context, options: { outputDirectory: './outputDirectory' }, command });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: { outputDirectory: './outputDirectory' },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      cliConfig: true,
      outputDirectory: './outputDirectory',
    },
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    sendTelemetry: 'sendTelemetry',
    print,
  });
});

test('startUp, options baseDirectory and outputDirectory', async () => {
  const context = {};
  await startUp({
    context,
    options: {
      baseDirectory: './baseDirectory',
      outputDirectory: './outputDirectory',
    },
    command,
  });

  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    cliConfig: { cliConfig: true },
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {
      baseDirectory: './baseDirectory',
      outputDirectory: './outputDirectory',
    },
    lowdefyVersion: 'lowdefyVersion',
    options: {
      baseDirectory: './baseDirectory',
      cliConfig: true,
      outputDirectory: './outputDirectory',
    },
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    sendTelemetry: 'sendTelemetry',
    print,
  });
});

test('startUp, no lowdefyVersion returned', async () => {
  getLowdefyYaml.mockImplementationOnce(() => ({ cliConfig: {} }));
  const context = {};
  await startUp({ context, options: {}, command });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliConfig: {},
    cliVersion: 'cliVersion',
    command: 'test',
    commandLineOptions: {},
    lowdefyVersion: undefined,
    options: {},
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    print,
    sendTelemetry: 'sendTelemetry',
  });
  expect(validateVersion).toHaveBeenCalledTimes(1);
  expect(print.log.mock.calls).toEqual([["Running 'lowdefy test'."]]);
});
