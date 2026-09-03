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

// The fixtures a test or journey names were loaded once by prepareSeeding; a
// fixture that failed to load fails every test naming it with the loader's
// message.
function resolveFixtures({ names, session }) {
  const fixtures = [];
  for (const name of names ?? []) {
    const loaded = session.fixtures?.get(name);
    if (type.isNone(loaded)) {
      return { error: `Fixture "${name}" was not loaded before the run.` };
    }
    if (!type.isNone(loaded.error)) {
      return { error: loaded.error };
    }
    fixtures.push(loaded.fixture);
  }
  return { fixtures };
}

export default resolveFixtures;
