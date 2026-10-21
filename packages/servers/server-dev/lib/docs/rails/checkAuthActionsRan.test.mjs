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

import checkAuthActionsRan, { armAuthActionRecorder } from './checkAuthActionsRan.js';
import authEngineMethods from './authEngineMethods.js';

// A page whose evaluate runs the function here, against a window made for the test.
function createPage(window) {
  return {
    evaluate: async (fn, arg) => {
      globalThis.window = window;
      try {
        return await fn(arg);
      } finally {
        delete globalThis.window;
      }
    },
  };
}

// The app calling an auth method while its document is the page's window.
async function callAuth(window, method, ...args) {
  globalThis.window = window;
  try {
    return await window.auth[method](...args);
  } finally {
    delete globalThis.window;
  }
}

function createWindow() {
  const store = new Map();
  const auth = {
    login: vi.fn(async () => 'logged in'),
    setActiveOrganization: vi.fn(async () => 'switched'),
    updateSession: vi.fn(async () => 'synced'),
    notAuthEngine: vi.fn(),
  };
  return {
    auth,
    lowdefy: { _internal: { auth } },
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    },
  };
}

const journey = { dataSetRails: {} };

test('a click whose auth actions were skipped passes', async () => {
  const window = createWindow();
  const page = createPage(window);
  await armAuthActionRecorder({ journey, page });
  await expect(
    checkAuthActionsRan({ journey, page, blockId: 'create_org' })
  ).resolves.toBeUndefined();
});

test('a click that ran an auth action fails, naming the block and the action', async () => {
  const window = createWindow();
  const page = createPage(window);
  await armAuthActionRecorder({ journey, page });
  await callAuth(window, 'setActiveOrganization', { organizationId: 'a' });
  await callAuth(window, 'updateSession');
  await expect(checkAuthActionsRan({ journey, page, blockId: 'create_org' })).rejects.toMatchObject(
    {
      message: expect.stringMatching(
        /^Block "create_org" ran the auth action SetActiveOrganization, UpdateSession, which a data-set journey cannot run: its users are injected and have no auth session\./
      ),
      expected: 'a click that runs no auth action',
      actual: 'a click that ran the auth action SetActiveOrganization, UpdateSession',
    }
  );
  // The recording is cleared once read.
  await expect(
    checkAuthActionsRan({ journey, page, blockId: 'create_org' })
  ).resolves.toBeUndefined();
});

test('a wrapped auth method still calls through with its arguments and result', async () => {
  const window = createWindow();
  const original = window.auth.login;
  await armAuthActionRecorder({ journey, page: createPage(window) });
  await expect(callAuth(window, 'login', { email: 'a@b.c' })).resolves.toBe('logged in');
  expect(original).toHaveBeenCalledWith({ email: 'a@b.c' });
});

test('methods that are not auth-engine methods are not recorded', async () => {
  const window = createWindow();
  const page = createPage(window);
  await armAuthActionRecorder({ journey, page });
  await callAuth(window, 'notAuthEngine');
  await expect(checkAuthActionsRan({ journey, page })).resolves.toBeUndefined();
});

test('the recording is read back after the document that made it is replaced', async () => {
  const first = createWindow();
  await armAuthActionRecorder({ journey, page: createPage(first) });
  await callAuth(first, 'login', {});
  // A navigation: a new document with the same sessionStorage.
  const second = createWindow();
  second.sessionStorage = first.sessionStorage;
  await expect(
    checkAuthActionsRan({ journey, page: createPage(second), blockId: 'sign_in' })
  ).rejects.toMatchObject({ actual: 'a click that ran the auth action Login' });
});

test('a click with no known block says A click', async () => {
  const window = createWindow();
  const page = createPage(window);
  await armAuthActionRecorder({ journey, page });
  await callAuth(window, 'login', {});
  await expect(checkAuthActionsRan({ journey, page, blockId: null })).rejects.toMatchObject({
    message: expect.stringMatching(/^A click ran the auth action Login,/),
  });
});

test('a journey without a data set is not recorded or checked', async () => {
  const window = createWindow();
  const page = createPage(window);
  await armAuthActionRecorder({ journey: {}, page });
  await callAuth(window, 'login', {});
  expect(window.sessionStorage.getItem('__lowdefyAuthActions')).toBeNull();
  await expect(checkAuthActionsRan({ journey: {}, page })).resolves.toBeUndefined();
});

test('a page with no auth methods records nothing and does not fail', async () => {
  const page = createPage({ lowdefy: {}, sessionStorage: createWindow().sessionStorage });
  await armAuthActionRecorder({ journey, page });
  await expect(checkAuthActionsRan({ journey, page })).resolves.toBeUndefined();
  expect(Object.keys(authEngineMethods).length).toBeGreaterThan(0);
});
