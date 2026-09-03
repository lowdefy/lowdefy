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

import { subscribe } from './devEventBus.js';

// Dev-only agent tooling: an in-memory registry of recorded request
// responses, keyed by (pageId, requestId). Populated by lib/docs/loadState.js
// when a state checkpoint is loaded with replay on, and consulted by
// src/routes/request.js so that once a checkpoint is loaded — for a headless
// verification page, a human tester's browser tab, or an e2e test driving the
// dev server directly — its recorded requests replay instead of hitting the
// real connection. Module-level state is fine: a dev server runs a single
// process per app.
//
// Replay is a mode the app is left in, not a one-shot, so it has to end
// deliberately: a rebuild changes the config the responses were recorded
// against, which is why loading mocks subscribes to the dev event bus and a
// build event drops every one of them. The subscription lives exactly as long
// as the mocks do, so an app that never replays never opens the bus's watcher.
const mocks = new Map();
const loggedKeys = new Set();

let unsubscribeFromBuilds = null;

function buildKey({ pageId, requestId }) {
  return `${pageId}::${requestId}`;
}

function watchForBuilds() {
  if (unsubscribeFromBuilds !== null) return;
  unsubscribeFromBuilds = subscribe((event) => {
    if (event.type !== 'build') return;
    clearMocks();
  });
}

// `mocks` here is the `requests` shape read.js/writeCheckpoint deal in:
// an object keyed by requestId, each value `{ payload, response, error,
// responseTime }`. Only response/error are replayed; payload/responseTime
// are recording metadata, not part of the replay contract.
function loadMocks({ pageId, checkpoint, mocks: entries = {} }) {
  if (type.isNone(pageId) || !type.isString(pageId)) {
    throw new Error(`loadMocks requires a "pageId" string. Received ${JSON.stringify(pageId)}.`);
  }
  Object.entries(entries).forEach(([requestId, entry]) => {
    const key = buildKey({ pageId, requestId });
    loggedKeys.delete(key);
    mocks.set(key, {
      pageId,
      requestId,
      checkpoint: checkpoint ?? null,
      response: entry?.response ?? null,
      error: entry?.error ?? null,
    });
  });
  if (mocks.size > 0) {
    watchForBuilds();
  }
}

function getMock({ pageId, requestId }) {
  return mocks.get(buildKey({ pageId, requestId }));
}

// True the first time a given (pageId, requestId) is answered from the
// registry. A replayed page re-fires the same requests on every render, and a
// line per fire would bury the one fact the developer needs: that this page is
// not talking to the database.
function claimMockLog({ pageId, requestId }) {
  const key = buildKey({ pageId, requestId });
  if (loggedKeys.has(key)) return false;
  loggedKeys.add(key);
  return true;
}

function clearMocks() {
  mocks.clear();
  loggedKeys.clear();
  if (unsubscribeFromBuilds === null) return;
  const unsubscribe = unsubscribeFromBuilds;
  unsubscribeFromBuilds = null;
  unsubscribe();
}

function listMocks() {
  return Array.from(mocks.values()).map(({ pageId, requestId, checkpoint, response, error }) => ({
    pageId,
    requestId,
    checkpoint,
    hasResponse: !type.isNone(response),
    hasError: !type.isNone(error),
  }));
}

export { claimMockLog, clearMocks, getMock, listMocks, loadMocks };
