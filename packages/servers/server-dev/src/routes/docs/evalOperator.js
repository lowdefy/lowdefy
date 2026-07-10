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

import evalOperator from '../../../lib/docs/evalOperator.js';

async function docsEvalOperatorHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  const { pageId, expression, source } = body;
  // Derived from the incoming request rather than a config value — this is
  // the origin an agent can actually reach the dev server on (host/port it
  // just connected to), regardless of how the server is bound.
  const origin = new URL(c.req.url).origin;

  const result = await evalOperator({ origin, pageId, expression, source });
  if (result.error) {
    return c.json({ error: result.error, source: result.source }, 502);
  }
  return c.json(result);
}

export default docsEvalOperatorHandler;
