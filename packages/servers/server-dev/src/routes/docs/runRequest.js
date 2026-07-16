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

import runRequest from '../../../lib/docs/runRequest.js';

// Refusals and request errors are returned as 200 data (see runRequest.js) —
// only malformed input (missing pageId/requestId) is a 400.
async function docsRunRequestHandler(c) {
  // Parse the body from a clone: runRequest builds a Lowdefy context whose
  // getSession(c) → getAuthUser(c) reconstructs a Request from c.req.raw,
  // which throws ("body ... disturbed or locked") if the body was already
  // consumed. The normal /api/request path never hits this because its
  // session is read in middleware before the handler touches the body.
  const { pageId, requestId, payload } = await c.req.raw.clone().json();
  try {
    const result = await runRequest({ pageId, requestId, payload, honoContext: c });
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}

export default docsRunRequestHandler;
