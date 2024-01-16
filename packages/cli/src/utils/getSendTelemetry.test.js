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

jest.unstable_mockModule('axios', () => ({
  default: {
    request: jest.fn(),
  },
}));

const appId = 'appId';
const cliVersion = 'cliVersion';
const lowdefyVersion = 'lowdefyVersion';

test('disable telemetry', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  const axios = (await import('axios')).default;
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    options: {
      disableTelemetry: true,
    },
    lowdefyVersion,
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(axios.request.mock.calls).toEqual([]);
});

test('send telemetry', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  const axios = (await import('axios')).default;
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    options: {},
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(axios.request.mock.calls).toEqual([
    [
      {
        data: {
          app_id: 'appId',
          cli_version: 'cliVersion',
          lowdefy_version: 'lowdefyVersion',
          x: 1,
        },
        headers: {
          'User-Agent': 'Lowdefy CLI vcliVersion',
        },
        method: 'post',
        url: 'https://api.lowdefy.net/v4/telemetry/cli',
      },
    ],
  ]);
});

test('send telemetry should not throw', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  const axios = (await import('axios')).default;
  axios.request.mockImplementation(() => {
    throw new Error('Test error');
  });
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    options: {},
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(true).toBe(true);
});
