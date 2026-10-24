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

import { callRequest, parseRequestBody } from '@lowdefy/api';

import buildPageIfNeeded from '../../lib/server/jitPageBuilder.js';
import getPathSegments from '../lib/getPathSegments.js';

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
  const { actionId, blockId, payload } = parseRequestBody({ text: await c.req.text() });

  // Page artifacts (including pages/{pageId}/requests/{requestId}.json) are
  // built JIT by GET /api/page/* and thrown away on every page invalidation
  // (lowdefyBuildWatcher). A client that already holds
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
