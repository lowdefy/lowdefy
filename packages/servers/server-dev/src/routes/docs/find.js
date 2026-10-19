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

import { ConfigError } from '@lowdefy/errors';

import findConfig from '../../../lib/docs/findConfig.js';

// findConfig throws a ConfigError only for a missing or non-string id; every
// other failure is a fault and propagates to the error handler rather than
// being reported to the caller as bad input.
async function docsFindHandler(c) {
  const id = c.req.param('id');
  const pageId = c.req.query('pageId');
  try {
    const result = await findConfig({ id, pageId });
    return c.json(result);
  } catch (error) {
    if (error instanceof ConfigError) {
      return c.json({ error: error.message }, 400);
    }
    throw error;
  }
}

export default docsFindHandler;
