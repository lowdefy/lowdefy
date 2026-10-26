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

function jsonResponse(body) {
  return {
    ok: true,
    status: 200,
    headers: { get: () => null },
    json: async () => body,
  };
}

// A native host for @lowdefy/client-core with no network: fetch answers every request with `{}`,
// and streamFetch (a block's streamed call, such as AgentChat's chat stream) with an empty body
// until a test gives it an answer. A cookie host by default; a 'bearer' host holds `token`, as a
// signed-in shell does.
function createFakeHost({ authTransport, path, token = null }) {
  const fetch = jest.fn(async () => jsonResponse({}));
  const streamFetch = jest.fn(async () => new Response(''));
  const auth =
    authTransport === 'bearer'
      ? { authTransport, tokenStore: { clear: jest.fn(), get: () => token, set: jest.fn() } }
      : {};
  return {
    ...auth,
    fetch,
    globals: createNativeGlobals({
      assign: jest.fn(),
      fetch,
      getPath: () => path,
      origin: 'https://app.lowdefy.test',
    }),
    onBuildChanged: jest.fn(),
    onCallerChanged: jest.fn(),
    router: { back: jest.fn(), push: jest.fn(), replace: jest.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    streamFetch,
    WebSocket: jest.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
}

export default createFakeHost;
