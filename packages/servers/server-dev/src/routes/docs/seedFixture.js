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

import seedFixture from '../../../lib/docs/seedFixture.js';

// Refusals and seeding errors are returned as 200 data (see seedFixture.js) -
// only malformed input (a missing name or a non-boolean reset, thrown as a
// ConfigError) is a 400. Anything else is a fault and propagates to the error
// handler.
async function docsSeedFixtureHandler(c) {
  // Parse the body from a clone: seedFixture builds a Lowdefy context whose
  // resolveAuthentication reads c.req.raw (headers), so leave the original
  // request body intact and read our own copy here.
  const { name, reset } = await c.req.raw.clone().json();
  try {
    const result = await seedFixture({ name, reset, honoContext: c });
    return c.json(result);
  } catch (error) {
    if (error instanceof ConfigError) {
      return c.json({ error: error.message }, 400);
    }
    throw error;
  }
}

export default docsSeedFixtureHandler;
