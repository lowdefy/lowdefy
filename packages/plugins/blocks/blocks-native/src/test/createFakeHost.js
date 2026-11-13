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

import { vi } from 'vitest';
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
  const fetch = vi.fn(async () => jsonResponse({}));
  const streamFetch = vi.fn(async () => new Response(''));
  const auth =
    authTransport === 'bearer'
      ? { authTransport, tokenStore: { clear: vi.fn(), get: () => token, set: vi.fn() } }
      : {};
  return {
    ...auth,
    fetch,
    globals: createNativeGlobals({
      assign: vi.fn(),
      fetch,
      getPath: () => path,
      origin: 'https://app.lowdefy.test',
    }),
    onBuildChanged: vi.fn(),
    onCallerChanged: vi.fn(),
    router: { back: vi.fn(), push: vi.fn(), replace: vi.fn() },
    sessionStorage: createMemoryStore(),
    storage: createMemoryStore(),
    streamFetch,
    WebSocket: vi.fn(),
    websocketUrl: (apiPath) => apiPath.replace(/^http/, 'ws'),
  };
}

export default createFakeHost;
