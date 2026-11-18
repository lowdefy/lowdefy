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

import { vi, expect, test } from 'vitest';

const mockFetch = vi.fn(async () => new Response(null, { status: 204 }));
vi.stubGlobal('fetch', mockFetch);

function sentRequest(index = 0) {
  const [url, init] = mockFetch.mock.calls[index];
  return { url, method: init.method, headers: init.headers, data: JSON.parse(init.body) };
}

const appId = 'appId';
const cliVersion = 'cliVersion';
const lowdefyVersion = 'lowdefyVersion';

test('disable telemetry', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    options: {
      disableTelemetry: true,
    },
    lowdefyVersion,
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(mockFetch.mock.calls).toEqual([]);
});

test('send telemetry', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    options: {},
  });
  await sendTelemetry({ data: { x: 1 } });
  expect(sentRequest()).toEqual({
    data: {
      app_id: 'appId',
      cli_version: 'cliVersion',
      lowdefy_version: 'lowdefyVersion',
      x: 1,
    },
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Lowdefy CLI vcliVersion',
    },
    method: 'POST',
    url: 'https://api.lowdefy.net/v4/telemetry/cli',
  });
});

test('send telemetry does not throw on an error status', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  mockFetch.mockResolvedValueOnce(new Response('Bad gateway', { status: 502 }));
  const sendTelemetry = getSendTelemetry({ appId, cliVersion, lowdefyVersion, options: {} });
  await expect(sendTelemetry({ data: { x: 1 } })).resolves.toBe(undefined);
});

test('send telemetry should not throw', async () => {
  const getSendTelemetry = (await import('./getSendTelemetry.js')).default;
  mockFetch.mockImplementationOnce(() => {
    throw new Error('Test error');
  });
  const sendTelemetry = getSendTelemetry({
    appId,
    cliVersion,
    lowdefyVersion,
    options: {},
  });
  await expect(sendTelemetry({ data: { x: 1 } })).resolves.toBe(undefined);
});
