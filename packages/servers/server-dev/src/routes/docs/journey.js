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
import runJourney from '../../../lib/docs/runJourney.js';
import validateJourneySteps from '../../../lib/docs/validateJourneySteps.js';

// A failed journey is a 200 with passed: false — it is the result the caller
// asked for. Malformed input (pageId, steps, user) is a 400 before any browser
// opens; only a render that could not run at all is a 502, so it is not
// mistaken for a journey that failed on an assertion.
async function docsJourneyHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  const { pageId, steps, urlQuery } = body;
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return c.json(
      {
        error: `POST /lowdefy-docs/journey requires a "pageId" string in the JSON body, e.g. {"pageId": "home", "steps": [{"click": "submit"}]}. Received ${JSON.stringify(
          pageId
        )}.`,
      },
      400
    );
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (stepsError) {
    return c.json({ error: stepsError }, 400);
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return c.json(
      { error: `The "urlQuery" param must be an object. Received ${JSON.stringify(urlQuery)}.` },
      400
    );
  }
  const { user, error: userError } = parseUserParam({ value: body.user });
  if (userError) {
    return c.json({ error: userError }, 400);
  }
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const result = await runJourney({ origin, pageId, steps, user, urlQuery });
  if (result.error) {
    return c.json({ error: result.error }, 502);
  }
  return c.json(result);
}

export default docsJourneyHandler;
