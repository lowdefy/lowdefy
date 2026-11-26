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

// The secrets a headless journey on the dev server runs with, as `lowdefy test --build`
// runs one: test-secret-<NAME> for every secret the dev build names, with the run's test values
// (`secrets`, by name, from the LOWDEFY_TEST_SECRET_* of the command that posted the journey)
// over them. The app's real LOWDEFY_SECRET_* are never read: they stay with the dev server's own
// routes and its browser journeys. The scrub redacts the test values, as the build host's does,
// and the CRON_SECRET and BETTER_AUTH_SECRET the dev server process still holds (the auth engine
// of a signed-out call with no data set runs on the process's own auth config). Pages the dev
// server has not built yet name nothing here; the host reads the names again once it builds or
// first reads a page.
function createHeadlessSecrets({ buildDirectory, secrets = {} }) {
  const testSecrets = createTestSecrets({
    names: readBuildSecretNames({ directories: { build: buildDirectory }, cache: namesCache }),
    secrets,
  });
  return {
    secrets: testSecrets,
    scrubSecrets: createSecretScrubber({ secrets: testSecrets }),
  };
}

export default createHeadlessSecrets;
