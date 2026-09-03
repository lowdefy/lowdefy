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

import parseUserParam from './parseUserParam.js';
import snapshotPage from '../../../lib/docs/snapshotPage.js';

// Query params are strings; `urlQuery` and `journey` arrive JSON-encoded. A
// param that is not JSON is a 400 naming the param, before any browser opens.
function parseJsonParam({ c, key, expected }) {
  const raw = c.req.query(key);
  if (type.isNone(raw)) {
    return {};
  }
  try {
    return { value: JSON.parse(raw) };
  } catch {
    return {
      error: `The "${key}" param must be JSON, e.g. ${expected}. Received ${JSON.stringify(raw)}.`,
    };
  }
}

async function docsSnapshotHandler(c) {
  const pageId = c.req.param('pageId');
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const { user, error: userError } = parseUserParam({ value: c.req.query('user') });
  if (userError) {
    return c.json({ error: userError }, 400);
  }
  const { value: urlQuery, error: urlQueryError } = parseJsonParam({
    c,
    key: 'urlQuery',
    expected: '{"id":"1"}',
  });
  if (urlQueryError) {
    return c.json({ error: urlQueryError }, 400);
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return c.json(
      { error: `The "urlQuery" param must be an object. Received ${JSON.stringify(urlQuery)}.` },
      400
    );
  }
  const { value: journey, error: journeyError } = parseJsonParam({
    c,
    key: 'journey',
    expected: '[{"click":"open"}]',
  });
  if (journeyError) {
    return c.json({ error: journeyError }, 400);
  }
  if (!type.isNone(journey) && !type.isArray(journey)) {
    return c.json(
      {
        error: `The "journey" param must be an array of steps. Received ${JSON.stringify(
          journey
        )}.`,
      },
      400
    );
  }

  const result = await snapshotPage({ origin, pageId, user, urlQuery, journey });
  if (result.error) {
    // A journey that failed is the caller's own input misbehaving on this
    // config; a render that could not run at all is the renderer's fault.
    return c.json({ error: result.error, failure: result.failure }, result.failure ? 422 : 502);
  }
  return c.json(result);
}

export default docsSnapshotHandler;
