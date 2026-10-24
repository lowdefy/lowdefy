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

import { peekCurrentApp } from './currentApp.js';
import startAppServices from './startAppServices.js';
import whenAppReady from './whenAppReady.js';

function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getState: () => state,
    set(update) {
      state = { ...state, ...update };
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createOpened() {
  const auth = createStore({ status: 'starting' });
  auth.fetch = jest.fn();
  auth.tokenStore = { get: () => null, subscribe: () => () => undefined };
  const session = createStore({ root: null });
  return {
    apiBase: 'https://app.test',
    auth,
    host: { router: {} },
    requestQueue: { start: jest.fn(() => () => undefined) },
    session,
    triggerAppEvent: jest.fn(),
  };
}

test('an app is ready once its auth is open and its session holds a root', async () => {
  const { auth, session } = createOpened();
  const ready = whenAppReady({ auth, session });
  const settled = jest.fn();
  ready.promise.then(settled);
  auth.set({ status: 'locked' });
  session.set({ root: {} });
  await Promise.resolve();
  expect(settled).not.toHaveBeenCalled();
  auth.set({ status: 'open' });
  await ready.promise;
  expect(settled).toHaveBeenCalled();
});

test('an app that is already open and holds a root is ready at once', async () => {
  const { auth, session } = createOpened();
  auth.set({ status: 'open' });
  session.set({ root: {} });
  await expect(whenAppReady({ auth, session }).promise).resolves.toBeUndefined();
});

test('the current app and the request queue wait until the app is ready', async () => {
  const opened = createOpened();
  const services = startAppServices({ app: opened });
  await Promise.resolve();
  expect(peekCurrentApp()).toBeNull();
  expect(opened.requestQueue.start).not.toHaveBeenCalled();
  opened.auth.set({ status: 'open' });
  opened.session.set({ root: {} });
  await services.app.ready;
  expect(peekCurrentApp()).toBe(services.app);
  expect(opened.requestQueue.start).toHaveBeenCalledTimes(1);
  services.stop();
  expect(peekCurrentApp()).toBeNull();
});

test('services stopped before the app is ready never make it current', async () => {
  const opened = createOpened();
  const services = startAppServices({ app: opened });
  services.stop();
  opened.auth.set({ status: 'open' });
  opened.session.set({ root: {} });
  await Promise.resolve();
  expect(peekCurrentApp()).toBeNull();
  expect(opened.requestQueue.start).not.toHaveBeenCalled();
});
