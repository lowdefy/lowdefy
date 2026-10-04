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

import closeWalk from '../../../lib/docs/explore/closeWalk.js';
import lowdefyConfig from '../../../lib/build/config.js';
import openWalk from '../../../lib/docs/explore/openWalk.js';
import stepWalk from '../../../lib/docs/explore/stepWalk.js';

async function readJson(c) {
  return c.req.json().catch(() => null);
}

// The explorer's walk session routes, under /lowdefy-docs so the docs routes'
// cross-site guard covers them. The explorer CLI runs its policy loop against
// these; the dev server owns the browser, the data sessions, the error
// stores and the runner. They enforce the write rules themselves.
function mountExploreWalkRoutes({ app }) {
  app.post('/lowdefy-docs/explore/walks', async (c) => {
    const { status, body } = await openWalk({
      body: await readJson(c),
      // The origin the caller reached this dev server on, as the journey route takes it.
      origin: new URL(c.req.url).origin,
      basePath: lowdefyConfig.basePath ?? '',
    });
    return c.json(body, status);
  });
  app.post('/lowdefy-docs/explore/walks/:id/steps', async (c) => {
    const { status, body } = await stepWalk({
      walkId: c.req.param('id'),
      body: await readJson(c),
    });
    return c.json(body, status);
  });
  app.delete('/lowdefy-docs/explore/walks/:id', async (c) => {
    const { status, body } = await closeWalk({ walkId: c.req.param('id') });
    return c.json(body, status);
  });
}

export default mountExploreWalkRoutes;
