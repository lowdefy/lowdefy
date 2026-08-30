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
import { readFixture } from '@lowdefy/node-utils';

// Reads every fixture the selected request tests name, once per name, before the
// dev server boots: prepareRequestTests needs the connectionIds they seed to
// redirect those connections at the memory server, and runRequestTest needs the
// documents. A fixture that fails to load is recorded as { error } rather than
// thrown, so the tests naming it fail with the message while the rest still run.
async function loadRequestTestFixtures({ context, items }) {
  const fixtures = new Map();
  for (const { test } of items) {
    if (!type.isArray(test?.fixtures)) {
      continue;
    }
    for (const name of test.fixtures) {
      if (!type.isString(name) || fixtures.has(name)) {
        continue;
      }
      try {
        const fixture = await readFixture({ configDirectory: context.directories.config, name });
        fixtures.set(name, { fixture });
      } catch (error) {
        fixtures.set(name, { error: error.message });
      }
    }
  }
  return fixtures;
}

export default loadRequestTestFixtures;
