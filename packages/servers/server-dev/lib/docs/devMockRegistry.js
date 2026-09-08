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

import { type } from '@lowdefy/helpers';

// Dev-only agent tooling: an in-memory registry of recorded request
// responses, keyed by (pageId, requestId). Populated by lib/docs/loadState.js
// when a state checkpoint is loaded, and consulted by src/routes/request.js
// so that once a checkpoint is loaded — for a headless verification page, a
// human tester's browser tab, or a future e2e test driving the dev server
// directly — its recorded requests replay instead of hitting the real
// connection. Module-level state is fine: a dev server runs a single process
// per app.
const mocks = new Map();

function buildKey({ pageId, requestId }) {
  return `${pageId}::${requestId}`;
}

// `mocks` here is the `requests` shape read.js/writeCheckpoint deal in:
// an object keyed by requestId, each value `{ payload, response, error,
// responseTime }`. Only response/error are replayed; payload/responseTime
// are recording metadata, not part of the replay contract.
function loadMocks({ pageId, mocks: entries = {} }) {
  if (type.isNone(pageId) || !type.isString(pageId)) {
    throw new Error(`loadMocks requires a "pageId" string. Received ${JSON.stringify(pageId)}.`);
  }
  Object.entries(entries).forEach(([requestId, entry]) => {
    mocks.set(buildKey({ pageId, requestId }), {
      pageId,
      requestId,
      response: entry?.response ?? null,
      error: entry?.error ?? null,
    });
  });
}

function getMock({ pageId, requestId }) {
  return mocks.get(buildKey({ pageId, requestId }));
}

function clearMocks() {
  mocks.clear();
}

function listMocks() {
  return Array.from(mocks.values()).map(({ pageId, requestId, response, error }) => ({
    pageId,
    requestId,
    hasResponse: !type.isNone(response),
    hasError: !type.isNone(error),
  }));
}

export { clearMocks, getMock, listMocks, loadMocks };
