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

import measurePage from '../../../lib/docs/measurePage.js';
import parseUserParam from './parseUserParam.js';

// REST twin of lowdefy_measure_page. Malformed input is a 400 before any
// browser opens; a page that could not be measured at all is a 502.
async function docsMeasurePageHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  const { pageId, steps, urlQuery } = body;
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return c.json(
      {
        error: `POST /lowdefy-docs/measure-page requires a "pageId" string in the JSON body, e.g. {"pageId": "home"}. Received ${JSON.stringify(
          pageId
        )}.`,
      },
      400
    );
  }
  const { user, error: userError } = parseUserParam({ value: body.user });
  if (userError) {
    return c.json({ error: userError }, 400);
  }
  // Derived from the incoming request rather than a config value — this is the
  // origin an agent can actually reach the dev server on.
  const origin = new URL(c.req.url).origin;
  const result = await measurePage({ origin, pageId, steps, urlQuery, user });
  if (result.error) {
    return c.json({ error: result.error }, 502);
  }
  return c.json(result);
}

export default docsMeasurePageHandler;
