/*
  Copyright 2020 Lowdefy, Inc

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

import axios from 'axios';
import getSendTelemetry from './getSendTelemetry';

jest.mock('axios', () => ({
  request: jest.fn(),
}));

const appId = 'appId';
const cliVersion = 'cliVersion';
const lowdefyVersion = 'lowdefyVersion';
const machineId = 'machineId';

test('disable telemetry', async () => {
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    disableTelemetry: true,
    lowdefyVersion,
    machineId,
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(axios.request.mock.calls).toEqual([]);
});

test('send telemetry', async () => {
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    machineId,
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(axios.request.mock.calls).toEqual([
    [
      {
        data: {
          appId: 'appId',
          cliVersion: 'cliVersion',
          lowdefyVersion: 'lowdefyVersion',
          machineId: 'machineId',
          x: 1,
        },
        headers: {
          'User-Agent': 'Lowdefy CLI vlowdefyVersion',
        },
        method: 'post',
        url: 'https://api.lowdefy.net/telemetry/cli',
      },
    ],
  ]);
});

test('send telemetry should not throw', async () => {
  axios.request.mockImplementation(() => {
    throw new Error('Test error');
  });
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    machineId,
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(true).toBe(true);
});
