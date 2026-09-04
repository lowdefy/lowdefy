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

import { callRequest, redactErrorResponse } from '@lowdefy/api';
import { serializer } from '@lowdefy/helpers';

import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';
import { claimMockLog, getMock } from '../../lib/docs/devMockRegistry.js';

async function requestHandler(c) {
  if (c.req.method !== 'POST') {
    // A wrong-method request is client-caused: answer 405 rather than raising a
    // fault that would be logged at error level and answered with a 500.
    return c.json({ error: 'Method not allowed.' }, 405);
  }
  const context = c.get('lowdefyContext');
  const segments = getPathSegments(c, '/api/request/');
  if (segments.length < 2) {
    return c.json({ error: 'Invalid request path' }, 400);
  }
  const requestId = segments[segments.length - 1];
  const pageId = segments.slice(0, -1).join('/');
  const { actionId, blockId, payload } = await c.req.json();

  // Dev-only agent tooling: once a state checkpoint has been loaded
  // (lib/docs/loadState.js), its recorded request/response pairs live in
  // devMockRegistry keyed by (pageId, requestId). Short-circuit here, before
  // ever touching the real connection, so a headless verification page, a
  // human tester's browser tab, or an e2e test replays exactly what was
  // recorded. The response shape mirrors @lowdefy/api's callRequest contract
  // (see callRequestResolver.js / callRequest.js success shape, and
  // middleware/errorHandler.js for the error shape) so the client's
  // Requests.js can't tell the difference from a real request.
  const mock = getMock({ pageId, requestId });
  if (mock) {
    // Once per (pageId, requestId): a replayed page re-fires its requests on
    // every render, and the fact worth surfacing is that this page is not
    // reaching the database at all — not each individual replay.
    if (claimMockLog({ pageId, requestId })) {
      context.logger.info({
        event: 'dev_mock_request',
        pageId,
        requestId,
        blockId,
        actionId,
        msg: `Request "${requestId}" on page "${pageId}" answered from checkpoint "${
          mock.checkpoint ?? 'unknown'
        }" — no connection was called. Load the checkpoint with replayRequests: false to hit the real connections.`,
      });
    }
    if (mock.error) {
      const error = mock.error instanceof Error ? mock.error : new Error(mock.error);
      return c.json(redactErrorResponse(context, error), 500);
    }
    return c.json({ success: true, response: serializer.serialize(mock.response) });
  }

  // Page artifacts (including pages/{pageId}/requests/{requestId}.json) are
  // built JIT by GET /api/page/* and thrown away on every page invalidation
  // (lowdefyBuildWatcher / moduleBuildWatcher). A client that already holds
  // the page config keeps firing requests across that window — and a request
  // that arrived before the page was rebuilt failed with
  // `Request "x" does not exist.` Run the same idempotent build the page route
  // runs (a no-op once the page is compiled) so the request artifact is there.
  await buildPageIfNeeded({
    pageId,
    buildDirectory: context.buildDirectory,
    configDirectory: context.configDirectory,
  });

  context.logger.info({ event: 'call_request', pageId, requestId, blockId, actionId });
  const response = await callRequest(context, { blockId, pageId, payload, requestId });
  return c.json(response);
}

export default requestHandler;
