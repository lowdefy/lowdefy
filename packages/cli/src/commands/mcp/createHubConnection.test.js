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

const connectHub = jest.fn();

jest.unstable_mockModule('../hub/connectHub.js', () => ({ default: connectHub }));

const { default: createHubConnection } = await import('./createHubConnection.js');

function fakeHubClient() {
  return {
    close: jest.fn(),
    onClose: jest.fn(),
    request: jest.fn(async (method) => ({ method })),
  };
}

beforeEach(() => {
  connectHub.mockReset();
});

test('parallel hub requests with no connection share one connect, so only one hub is started', async () => {
  const hubClient = fakeHubClient();
  connectHub.mockImplementation(async () => hubClient);
  const hub = createHubConnection();
  const results = await Promise.all([
    hub.request('start', {}),
    hub.attach({ configDirectory: '/app' }),
    hub.request('status', {}, { autoStart: false }),
  ]);
  expect(connectHub).toHaveBeenCalledTimes(1);
  expect(results[0]).toEqual({ method: 'start' });
});

test('a request that may start the hub does not settle for a shared status check that found none', async () => {
  const hubClient = fakeHubClient();
  connectHub.mockImplementation(async ({ autoStart }) => (autoStart ? hubClient : null));
  const hub = createHubConnection();
  const [status, start] = await Promise.all([
    hub.request('status', {}, { autoStart: false }),
    hub.request('start', {}),
  ]);
  expect(status).toBeNull();
  expect(start).toEqual({ method: 'start' });
});
