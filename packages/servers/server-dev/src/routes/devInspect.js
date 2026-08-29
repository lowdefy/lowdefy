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

import { serializer } from '@lowdefy/helpers';

import { readCheckpoint } from '../../lib/docs/checkpointStore.js';
import { loadMocks } from '../../lib/docs/devMockRegistry.js';
import getPathSegments from '../lib/getPathSegments.js';
import { listTabs, resolveTabRequest } from '../../lib/docs/tabChannel.js';

// Origin/host check mirrors clientError.js — this endpoint accepts a POST
// from Inspector.jsx (a same-origin dev-only browser component), not from
// arbitrary agents, so it needs the same CSRF-style guard.
function checkOrigin(c) {
  const origin = c.req.header('origin');
  if (!origin) {
    return false;
  }
  try {
    return new URL(origin).host === c.req.header('host');
  } catch {
    return false;
  }
}

// Dev-only agent-state-xray: a human tab bootstrapping from a
// `?_checkpoint=<name>` URL (client/Inspector.jsx) fetches this. It returns
// the checkpoint's state part + manifest for the tab to inject client-side,
// and — as a side effect — loads the checkpoint's recorded requests into
// devMockRegistry server-side, so that tab's own requests (src/routes/
// request.js) replay recorded data instead of hitting real connections.
function handleCheckpointBootstrap(c, { name }) {
  let checkpoint;
  try {
    checkpoint = readCheckpoint({ name });
  } catch (error) {
    return c.json({ error: error.message }, 404);
  }
  loadMocks({ pageId: checkpoint.checkpoint.pageId, mocks: checkpoint.requests });
  return c.json(
    serializer.serialize({
      checkpoint: checkpoint.checkpoint,
      state: checkpoint.state,
      urlQuery: checkpoint.urlQuery,
      input: checkpoint.input,
      user: checkpoint.user,
      global: checkpoint.global,
    })
  );
}

// GET lists connected tabs for diagnostics (or, under /checkpoint/<name>,
// bootstraps a human tab from a state checkpoint); POST is the answer leg of
// the SSE request/response round trip (Inspector.jsx posts back {requestId,
// result} after handling an inspect-request/eval-request event).
async function devInspectHandler(c) {
  if (c.req.method === 'GET') {
    const segments = getPathSegments(c, '/api/dev-inspect/');
    if (segments[0] === 'checkpoint' && segments[1]) {
      return handleCheckpointBootstrap(c, { name: segments[1] });
    }
    return c.json({ tabs: listTabs() });
  }

  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }

  if (!checkOrigin(c)) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  const { requestId, result } = await c.req.json();
  if (!requestId) {
    return c.json({ error: 'Missing "requestId".' }, 400);
  }
  const resolved = resolveTabRequest({ requestId, result });
  return c.json({ ok: resolved });
}

export default devInspectHandler;
