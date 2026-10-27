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

import createFakeNetwork, { OFFLINE, ONLINE } from '../test/createFakeNetwork.js';
import createNetworkStatus from './createNetworkStatus.js';

// Lets the first read of the phone's network answer.
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

test('the phone going offline and back is heard by subscribers, once per change', async () => {
  const network = createFakeNetwork();
  const status = createNetworkStatus({ network });
  const listener = jest.fn();
  status.subscribe(listener);
  await settle();
  expect(status.isOnline()).toBe(true);
  network.change(OFFLINE);
  network.change(OFFLINE);
  expect(status.isOnline()).toBe(false);
  network.change(ONLINE);
  expect(listener.mock.calls).toEqual([[false], [true]]);
});

test('the first read of the phone network sets the state', async () => {
  const status = createNetworkStatus({ network: createFakeNetwork({ state: OFFLINE }) });
  const listener = jest.fn();
  status.subscribe(listener);
  expect(status.isOnline()).toBe(true);
  await settle();
  expect(status.isOnline()).toBe(false);
  expect(listener).toHaveBeenCalledWith(false);
});

test('a change heard before the first read answers wins over that read', async () => {
  const network = createFakeNetwork({ state: OFFLINE });
  const status = createNetworkStatus({ network });
  status.subscribe(() => undefined);
  network.change(ONLINE);
  network.getNetworkStateAsync = async () => OFFLINE;
  await settle();
  expect(status.isOnline()).toBe(true);
});

test('injected offline takes the shell offline while the phone is online, until it is lifted', async () => {
  const status = createNetworkStatus({ network: createFakeNetwork() });
  const listener = jest.fn();
  status.subscribe(listener);
  await settle();
  status.setInjectedOffline(true);
  expect(status.isOnline()).toBe(false);
  status.setInjectedOffline(false);
  expect(status.isOnline()).toBe(true);
  expect(listener.mock.calls).toEqual([[false], [true]]);
});

test('lifting injected offline leaves the shell offline while the phone is offline', async () => {
  const network = createFakeNetwork();
  const status = createNetworkStatus({ network });
  status.subscribe(() => undefined);
  await settle();
  status.setInjectedOffline(true);
  network.change(OFFLINE);
  status.setInjectedOffline(false);
  expect(status.isOnline()).toBe(false);
});

test('the phone network is read only while something subscribes', async () => {
  const network = createFakeNetwork();
  const status = createNetworkStatus({ network });
  expect(network.listening()).toBe(false);
  const first = status.subscribe(() => undefined);
  const second = status.subscribe(() => undefined);
  expect(network.listening()).toBe(true);
  first();
  first();
  expect(network.listening()).toBe(true);
  second();
  expect(network.listening()).toBe(false);
});
