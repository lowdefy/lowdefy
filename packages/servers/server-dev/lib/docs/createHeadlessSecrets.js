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

import { createSecretScrubber } from '@lowdefy/node-utils';
import { createTestSecrets, readBuildSecretNames } from '@lowdefy/test-utils/secrets';

// Each dev build file's secret names, for the life of the server: a file is read again only once
// it changes, so a journey rereads only the pages built since the last one.
const namesCache = new Map();

// The secrets a headless journey on the dev server runs with, as `lowdefy test --headless --build`
// runs one: test-secret-<NAME> for every secret the dev build names, with the run's test values
// (`secrets`, by name, from the LOWDEFY_TEST_SECRET_* of the command that posted the journey)
// over them. The app's real LOWDEFY_SECRET_* are never read: they stay with the dev server's own
// routes and its browser journeys. The scrub redacts the test values only, as the build host's
// does. Pages the dev server has not built yet name nothing here; the host reads the names again
// once it builds or first reads a page.
function createHeadlessSecrets({ buildDirectory, secrets = {} }) {
  const testSecrets = createTestSecrets({
    names: readBuildSecretNames({ directories: { build: buildDirectory }, cache: namesCache }),
    secrets,
  });
  return {
    secrets: testSecrets,
    scrubSecrets: createSecretScrubber({ secrets: testSecrets, env: {} }),
  };
}

export default createHeadlessSecrets;
