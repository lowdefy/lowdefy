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
// eslint-disable-next-line no-unused-vars
import createPrint from './print';
// eslint-disable-next-line no-unused-vars
import getConfig from './getConfig';
// eslint-disable-next-line no-unused-vars
import getSendTelemetry from './getSendTelemetry';
// eslint-disable-next-line no-unused-vars
import packageJson from '../../package.json';

jest.mock('./getConfig', () => async () =>
  Promise.resolve({ appId: 'appId', disableTelemetry: true, lowdefyVersion: 'lowdefyVersion' })
);
jest.mock('./print', () => () => 'print');
jest.mock('../../package.json', () => ({ version: 'cliVersion' }));
jest.mock('./getSendTelemetry', () => () => 'sendTelemetry');

test('startUp, options undefined', async () => {
  const context = {};
  await startUp({ context });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliVersion: 'cliVersion',
    disableTelemetry: true,
    lowdefyVersion: 'lowdefyVersion',
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    sendTelemetry: 'sendTelemetry',
    print: 'print',
  });
});

test('startUp, options empty', async () => {
  const context = {};
  await startUp({ context, options: {} });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliVersion: 'cliVersion',
    disableTelemetry: true,
    lowdefyVersion: 'lowdefyVersion',
    outputDirectory: path.resolve(process.cwd(), './.lowdefy/build'),
    sendTelemetry: 'sendTelemetry',
    print: 'print',
  });
});

test('startUp, options baseDirectory', async () => {
  const context = {};
  await startUp({ context, options: { baseDirectory: './baseDirectory' } });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    cliVersion: 'cliVersion',
    disableTelemetry: true,
    lowdefyVersion: 'lowdefyVersion',
    outputDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/build'),
    sendTelemetry: 'sendTelemetry',
    print: 'print',
  });
});

test('startUp, options outputDirectory', async () => {
  const context = {};
  await startUp({ context, options: { outputDirectory: './outputDirectory' } });
  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd()),
    cacheDirectory: path.resolve(process.cwd(), './.lowdefy/.cache'),
    cliVersion: 'cliVersion',
    disableTelemetry: true,
    lowdefyVersion: 'lowdefyVersion',
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    sendTelemetry: 'sendTelemetry',
    print: 'print',
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
  });

  expect(context).toEqual({
    appId: 'appId',
    baseDirectory: path.resolve(process.cwd(), 'baseDirectory'),
    cacheDirectory: path.resolve(process.cwd(), 'baseDirectory/.lowdefy/.cache'),
    cliVersion: 'cliVersion',
    disableTelemetry: true,
    lowdefyVersion: 'lowdefyVersion',
    outputDirectory: path.resolve(process.cwd(), 'outputDirectory'),
    sendTelemetry: 'sendTelemetry',
    print: 'print',
  });
});
