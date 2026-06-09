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

import { callRequest } from '@lowdefy/api';

import getPathSegments from '../lib/getPathSegments.js';

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
  context.logger.info({ event: 'call_request', pageId, requestId, blockId, actionId });
  const response = await callRequest(context, { blockId, pageId, payload, requestId });
  return c.json(response);
}

export default requestHandler;
