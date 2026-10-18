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
import { jest } from '@jest/globals';
import { act, fireEvent, render, screen } from '@testing-library/react-native';

import createMemoryStore from '../host/createMemoryStore.js';
import DevShell from './DevShell.js';

// The opened app is recorded, not built: its auth, session and screens have their own tests.
const mockOpened = [];
jest.mock('../components/AppProvider.js', () => {
  function AppProvider({ app, children, shell }) {
    mockOpened.push({ app, shell });
    const { Text: MockText } = jest.requireActual('react-native');
    return (
      <>
        <MockText testID="opened-app">{app.urls.dev}</MockText>
        {children}
      </>
    );
  }
  return AppProvider;
});
jest.mock('../components/Frame.js', () => () => null);
jest.mock('./tab/DevTabClient.js', () => () => null);
jest.mock('../host/createDeviceStore.js', () => () => {
  throw new Error('The tests pass a device store.');
});
jest.mock('../config/getShellConfig.js', () => () => {
  throw new Error('The tests pass the shell config.');
});
jest.mock('expo-splash-screen', () => ({ hideAsync: jest.fn() }));
jest.mock('expo-network', () => ({
  addNetworkStateListener: () => ({ remove: () => undefined }),
  getNetworkStateAsync: async () => ({ isConnected: true, isInternetReachable: true }),
}));
jest.mock('expo-sensors', () => ({ Accelerometer: {} }));
jest.mock('expo-camera', () => ({
  CameraView: () => null,
  useCameraPermissions: () => [{ granted: true }, jest.fn()],
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const shell = {
  id: 'lowdefy-dev',
  name: 'Lowdefy Dev',
  environment: 'dev',
  scheme: 'lowdefy-dev',
  version: '7.0.0',
  apps: [{ id: 'dev', name: 'Lowdefy Dev', urls: { dev: 'http://localhost:3000' } }],
};

function createLinking(initialUrl = null) {
  const listeners = new Set();
  return {
    getInitialURL: jest.fn(async () => initialUrl),
    addEventListener: (event, listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    open: (url) => listeners.forEach((listener) => listener({ url })),
  };
}

function createAccelerometer() {
  let listener = null;
  return {
    setUpdateInterval: jest.fn(),
    addListener: (fn) => {
      listener = fn;
      return { remove: () => undefined };
    },
    shake: () => [0, 1, 2].forEach(() => listener({ x: 2, y: 2, z: 2 })),
  };
}

async function renderDevShell({ initialUrl = null, kv = createMemoryStore() } = {}) {
  const linking = createLinking(initialUrl);
  const accelerometer = createAccelerometer();
  await render(<DevShell accelerometer={accelerometer} kv={kv} linking={linking} shell={shell} />);
  await act(async () => {});
  return { accelerometer, kv, linking };
}

const lanLink = 'lowdefy-dev://connect?url=http%3A%2F%2F192.168.1.20%3A3000&pair=k3x9q';

beforeEach(() => {
  mockOpened.splice(0);
});

test('with no server, Lowdefy Dev shows the connect screen', async () => {
  await renderDevShell();
  expect(screen.getByTestId('dev-connect')).toBeTruthy();
  expect(screen.queryByTestId('opened-app')).toBeNull();
});

test('a connect link asks "Connect to <host>?" and attaches only once confirmed', async () => {
  const { kv } = await renderDevShell({ initialUrl: lanLink });
  expect(screen.getByText('Connect to 192.168.1.20:3000?')).toBeTruthy();
  expect(screen.queryByTestId('opened-app')).toBeNull();
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-confirm-connect'));
  });
  expect(screen.getByTestId('opened-app').props.children).toBe('http://192.168.1.20:3000');
  expect(JSON.parse(kv.get('lowdefy-dev:servers'))).toEqual([
    { url: 'http://192.168.1.20:3000', host: '192.168.1.20:3000', pair: 'k3x9q' },
  ]);
});

test('the opened app sends the pairing token on every call', async () => {
  await renderDevShell({ initialUrl: lanLink });
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-confirm-connect'));
  });
  const { app, shell: devShell } = mockOpened.at(-1);
  expect(app.id).toBe('dev-192.168.1.20_3000');
  const fetch = jest.fn(async () => ({ status: 200 }));
  const pairedFetch = devShell.transport.wrapFetch(fetch);
  await pairedFetch('http://192.168.1.20:3000/api/mobile/root');
  expect(fetch.mock.calls[0][1].headers).toEqual({ 'x-lowdefy-pair': 'k3x9q' });
});

test('a cancelled link attaches to nothing', async () => {
  const { kv } = await renderDevShell({ initialUrl: lanLink });
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-confirm-cancel'));
  });
  expect(screen.queryByText('Connect to 192.168.1.20:3000?')).toBeNull();
  expect(screen.queryByTestId('opened-app')).toBeNull();
  expect(kv.get('lowdefy-dev:servers')).toBeNull();
});

test('a typed address is confirmed before it is attached to', async () => {
  await renderDevShell();
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('dev-connect-url'), '192.168.1.20:3000');
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-connect-submit'));
  });
  expect(screen.getByText('Connect to 192.168.1.20:3000?')).toBeTruthy();
  expect(screen.queryByTestId('opened-app')).toBeNull();
});

test('a simulator link to localhost connects at once', async () => {
  await renderDevShell({
    initialUrl: 'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000',
  });
  expect(screen.queryByTestId('dev-confirm-sheet')).toBeNull();
  expect(screen.getByTestId('opened-app').props.children).toBe('http://localhost:3000');
});

test('the last server opens at launch, and a link to another one is confirmed first', async () => {
  const kv = createMemoryStore();
  kv.set(
    'lowdefy-dev:servers',
    JSON.stringify([{ url: 'http://10.0.0.5:3000', host: '10.0.0.5:3000', pair: 'old' }])
  );
  const { linking } = await renderDevShell({ kv });
  expect(screen.getByTestId('opened-app').props.children).toBe('http://10.0.0.5:3000');
  await act(async () => {
    linking.open(lanLink);
  });
  expect(screen.getByText('Connect to 192.168.1.20:3000?')).toBeTruthy();
  expect(screen.getByTestId('opened-app').props.children).toBe('http://10.0.0.5:3000');
});

test('shaking the phone opens the dev menu, with the shell version', async () => {
  const { accelerometer } = await renderDevShell({
    initialUrl: 'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000',
  });
  expect(screen.queryByTestId('dev-menu')).toBeNull();
  await act(async () => {
    accelerometer.shake();
  });
  expect(screen.getByTestId('dev-menu')).toBeTruthy();
  expect(screen.getByTestId('dev-menu-version').props.children).toBe(
    'Shell 7.0.0 · localhost:3000'
  );
});

test('a menu link opens the dev menu, and switch server goes back to the connect screen', async () => {
  const { linking } = await renderDevShell({
    initialUrl: 'lowdefy-dev://connect?url=http%3A%2F%2Flocalhost%3A3000',
  });
  await act(async () => {
    linking.open('lowdefy-dev://menu');
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-menu-switch'));
  });
  expect(screen.getByTestId('dev-connect')).toBeTruthy();
  expect(screen.getByTestId('dev-recent-localhost:3000')).toBeTruthy();
});

test('the dev menu shows the shell logs and the block gallery entry', async () => {
  jest.spyOn(console, 'info').mockImplementation(() => undefined);
  const { linking } = await renderDevShell();
  await act(async () => {
    linking.open('lowdefy-dev://menu');
  });
  await act(async () => {
    console.info('Dev tab: joined the dev server as tab phone.');
    fireEvent.press(screen.getByTestId('dev-menu-logs'));
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
  expect(screen.getByText(/Dev tab: joined the dev server as tab phone\./)).toBeTruthy();
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-menu-close'));
  });
  await act(async () => {
    fireEvent.press(screen.getByTestId('dev-menu-gallery'));
  });
  expect(screen.getByTestId('dev-block-gallery')).toBeTruthy();
});
