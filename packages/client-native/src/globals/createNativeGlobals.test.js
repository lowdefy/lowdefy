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
import { AppState, Dimensions } from 'react-native';
import { LowdefyInternalError } from '@lowdefy/errors';

import createNativeGlobals from './createNativeGlobals.js';

function setup({ network } = {}) {
  const route = { path: '/orders/42?status=open#notes' };
  const assign = jest.fn();
  const fetch = jest.fn();
  const globals = createNativeGlobals({
    assign,
    fetch,
    getPath: () => route.path,
    network,
    origin: 'https://app.lowdefy.test:8443',
  });
  return { assign, fetch, globals, route };
}

test('location is the shown route on the app origin, read when it is used', () => {
  const { globals, route } = setup();
  const { location } = globals.window;
  expect(location.href).toBe('https://app.lowdefy.test:8443/orders/42?status=open#notes');
  expect(location.pathname).toBe('/orders/42');
  expect(location.search).toBe('?status=open');
  expect(location.hash).toBe('#notes');
  expect(location.origin).toBe('https://app.lowdefy.test:8443');
  expect(location.host).toBe('app.lowdefy.test:8443');
  expect(location.hostname).toBe('app.lowdefy.test');
  expect(location.port).toBe('8443');
  expect(location.protocol).toBe('https:');
  route.path = '/home';
  expect(location.pathname).toBe('/home');
  expect(location.search).toBe('');
  expect(location.hash).toBe('');
});

test('location.assign goes to the host and fetch is the host fetch', () => {
  const { assign, fetch, globals } = setup();
  globals.window.location.assign('https://elsewhere.test/');
  expect(assign).toHaveBeenCalledWith('https://elsewhere.test/');
  expect(globals.fetch).toBe(fetch);
});

test('createNativeGlobals throws a LowdefyInternalError on an origin that is not a URL origin', () => {
  const create = () =>
    createNativeGlobals({ assign: jest.fn(), fetch: jest.fn(), getPath: () => '/', origin: 'app' });
  expect(create).toThrow('Native host origin is not a URL origin. Received "app".');
  expect(create).toThrow(LowdefyInternalError);
});

test('the window size comes from Dimensions, and resize follows Dimensions changes', () => {
  const { globals } = setup();
  const { width, height } = Dimensions.get('window');
  expect(globals.window.innerWidth).toBe(width);
  expect(globals.window.innerHeight).toBe(height);
  const remove = jest.fn();
  const addSpy = jest.spyOn(Dimensions, 'addEventListener').mockReturnValue({ remove });
  const listener = jest.fn();
  globals.window.addEventListener('resize', listener);
  addSpy.mock.calls[0][1]({ window: { width: 1, height: 2 } });
  expect(listener).toHaveBeenCalledTimes(1);
  globals.window.removeEventListener('resize', listener);
  expect(remove).toHaveBeenCalledTimes(1);
  addSpy.mockRestore();
});

test('visibilityState follows AppState, and visibilitychange follows its changes', () => {
  const { globals } = setup();
  const current = AppState.currentState;
  AppState.currentState = 'active';
  expect(globals.document.visibilityState).toBe('visible');
  AppState.currentState = 'background';
  expect(globals.document.visibilityState).toBe('hidden');
  AppState.currentState = current;
  const remove = jest.fn();
  const addSpy = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove });
  const listener = jest.fn();
  globals.document.addEventListener('visibilitychange', listener);
  expect(addSpy.mock.calls[0][0]).toBe('change');
  addSpy.mock.calls[0][1]('background');
  expect(listener).toHaveBeenCalledTimes(1);
  globals.document.removeEventListener('visibilitychange', listener);
  expect(remove).toHaveBeenCalledTimes(1);
  addSpy.mockRestore();
});

test('online and offline follow the host network, when it gives one', () => {
  let networkListener;
  const remove = jest.fn();
  const network = {
    addListener: jest.fn((listener) => {
      networkListener = listener;
      return remove;
    }),
  };
  const { globals } = setup({ network });
  const onOffline = jest.fn();
  globals.window.addEventListener('offline', onOffline);
  networkListener(true);
  expect(onOffline).not.toHaveBeenCalled();
  networkListener(false);
  expect(onOffline).toHaveBeenCalledWith({ type: 'offline' });
  globals.window.removeEventListener('offline', onOffline);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('an event the host has no source for is not listened to', () => {
  const { globals } = setup();
  const listener = jest.fn();
  globals.window.addEventListener('online', listener);
  globals.window.addEventListener('focus', listener);
  globals.window.removeEventListener('focus', listener);
  expect(listener).not.toHaveBeenCalled();
});
