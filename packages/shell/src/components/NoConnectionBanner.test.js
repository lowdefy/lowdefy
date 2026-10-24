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

import React from 'react';
import { act, render, screen } from '@testing-library/react-native';

import createDeviceInjections from '../dev/inject/createDeviceInjections.js';
import NoConnectionBanner from './NoConnectionBanner.js';
import { OFFLINE, ONLINE } from '../test/createFakeNetwork.js';

// The phone's network, set by the tests through expo-network's listener.
const mockNetwork = {
  listeners: new Set(),
  state: { isConnected: true, isInternetReachable: true },
};
jest.mock('expo-network', () => ({
  addNetworkStateListener(listener) {
    mockNetwork.listeners.add(listener);
    return { remove: () => mockNetwork.listeners.delete(listener) };
  },
  getNetworkStateAsync: async () => mockNetwork.state,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// The shell's own online state, which the banner reads.
const networkStatus = jest.requireActual('../host/networkStatus.js').default;

function changeNetwork(state) {
  mockNetwork.state = state;
  mockNetwork.listeners.forEach((listener) => listener(state));
}

afterEach(() => {
  networkStatus.setInjectedOffline(false);
  changeNetwork(ONLINE);
});

test('the banner shows while the phone is offline', async () => {
  await render(<NoConnectionBanner />);
  await act(async () => {});
  expect(screen.queryByTestId('NoConnection')).toBeNull();
  await act(async () => changeNetwork(OFFLINE));
  expect(screen.getByText('No connection')).toBeTruthy();
  await act(async () => changeNetwork(ONLINE));
  expect(screen.queryByTestId('NoConnection')).toBeNull();
});

// A simulator shares the computer's network: Lowdefy Dev's network injection is how an agent
// sees the banner there.
test("the banner shows while Lowdefy Dev's injection holds the network offline", async () => {
  const injections = createDeviceInjections({ networkStatus });
  await render(<NoConnectionBanner />);
  await act(async () => {});
  await act(async () => injections.inject({ kind: 'network', value: 'offline' }));
  expect(screen.getByTestId('NoConnection')).toBeTruthy();
  await act(async () => injections.inject({ kind: 'network', value: 'online' }));
  expect(screen.queryByTestId('NoConnection')).toBeNull();
});
