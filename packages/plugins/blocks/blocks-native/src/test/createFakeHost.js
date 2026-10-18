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
import { createNativeGlobals } from '@lowdefy/client-native';

import createMemoryStore from './createMemoryStore.js';

function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[name] ?? null },
    json: async () => body,
  };
}

// A native host for @lowdefy/client-core with no network: fetch answers every request with
// `response`, and the route is held in `route.path`.
function createFakeHost({ path = '/home', response = {} } = {}) {
  const route = { path };
  const fetch = jest.fn(async () => jsonResponse(response));
  const host = {
    fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch,
      getPath: () => route.path,
      origin: 'https://app.lowdefy.test',
    }),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
  return { host, route };
}

export { jsonResponse };
export default createFakeHost;
