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

import createConfigCheckpoint from '../../../lib/docs/createConfigCheckpoint.js';

// Lets an agent snapshot the config directory before an experimental change,
// so it can revert cleanly with POST /lowdefy-docs/checkpoints/revert if the
// change doesn't work out.
async function docsCheckpointsCreateHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  const result = createConfigCheckpoint({ label: body.label });
  return c.json(result);
}

export default docsCheckpointsCreateHandler;
