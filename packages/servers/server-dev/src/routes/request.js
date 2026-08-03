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

import getPathSegments from '../lib/getPathSegments.js';
import { getMock } from '../../lib/docs/devMockRegistry.js';

async function requestHandler(c) {
  if (c.req.method !== 'POST') {
    throw new Error('Only POST requests are supported.');
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
    context.logger.info({ event: 'dev_mock_request', pageId, requestId, blockId, actionId });
    if (mock.error) {
      const error = mock.error instanceof Error ? mock.error : new Error(mock.error);
      return c.json(redactErrorResponse(context, error), 500);
    }
    return c.json({ success: true, response: serializer.serialize(mock.response) });
  }

  context.logger.info({ event: 'call_request', pageId, requestId, blockId, actionId });
  const response = await callRequest(context, { blockId, pageId, payload, requestId });
  return c.json(response);
}

export default requestHandler;
