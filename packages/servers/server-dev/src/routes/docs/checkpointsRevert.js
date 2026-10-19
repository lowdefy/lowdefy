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

import revertConfigCheckpoint from '../../../lib/docs/revertConfigCheckpoint.js';

async function docsCheckpointsRevertHandler(c) {
  const body = await c.req.json().catch(() => ({}));
  if (!body.id) {
    return c.json({ error: 'revert requires an "id" of the checkpoint to restore.' }, 400);
  }

  try {
    const result = revertConfigCheckpoint({ id: body.id });
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
}

export default docsCheckpointsRevertHandler;
