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

import createDevShellConfig from '../connection/createDevShellConfig.js';
import createDeviceInjections from './createDeviceInjections.js';
import createFakeNetwork from '../../test/createFakeNetwork.js';
import createNetworkStatus from '../../host/createNetworkStatus.js';
import createOfflineFetch from './createOfflineFetch.js';

const shell = { environment: 'dev', version: '7.4.0' };

function setup({ pair = null } = {}) {
  const injections = createDeviceInjections({
    networkStatus: createNetworkStatus({ network: createFakeNetwork() }),
  });
  const fetch = jest.fn(async () => ({ ok: true }));
  const devShell = createDevShellConfig({
    fetch: createOfflineFetch({ fetch, isOffline: injections.isOffline }),
    server: { url: 'http://192.168.1.20:3000', host: '192.168.1.20:3000', pair },
    shell,
    WebSocket: class {},
  });
  return { devShell, fetch, injections };
}

test("offline, the app's every fetch fails as React Native's fetch fails with no network", async () => {
  const { devShell, fetch, injections } = setup({ pair: 'token' });
  await devShell.transport.fetch('http://192.168.1.20:3000/api/page/home');
  expect(fetch).toHaveBeenCalledTimes(1);

  injections.inject({ kind: 'network', value: 'offline' });
  const failed = devShell.transport.fetch('http://192.168.1.20:3000/api/request/home/load');
  await expect(failed).rejects.toThrow(TypeError);
  await expect(failed).rejects.toThrow('Network request failed');
  expect(fetch).toHaveBeenCalledTimes(1);

  injections.inject({ kind: 'network', value: 'online' });
  await devShell.transport.fetch('http://192.168.1.20:3000/api/page/home');
  expect(fetch).toHaveBeenCalledTimes(2);
});

test('offline, the dev-tab client still reaches the dev server, so an agent can go back online', async () => {
  const { devShell, injections } = setup({ pair: 'token' });
  injections.inject({ kind: 'network', value: 'offline' });
  const tabFetch = jest.fn(async () => ({ ok: true }));
  await devShell.transport.wrapFetch(tabFetch)('http://192.168.1.20:3000/api/dev-inspect', {
    method: 'POST',
  });
  expect(tabFetch).toHaveBeenCalledWith('http://192.168.1.20:3000/api/dev-inspect', {
    method: 'POST',
    headers: { 'x-lowdefy-pair': 'token' },
  });
});
