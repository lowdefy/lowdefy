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

import startJourneyFixture from '../../../../../scripts/lib/startJourneyFixture.mjs';

// Starts apps/journey-fixture once for every fixture test file, and hands its
// url to the test workers through the environment they inherit. With no
// Chromium every test skips.
async function globalSetup() {
  const fixture = await startJourneyFixture({
    port: Number(process.env.LOWDEFY_JOURNEY_FIXTURE_PORT ?? 3300),
  });
  if (fixture.skipped) {
    process.env.LOWDEFY_JOURNEY_FIXTURE_SKIP = fixture.skipped;
    return;
  }
  globalThis.__lowdefyJourneyFixture = fixture;
  process.env.LOWDEFY_JOURNEY_FIXTURE_URL = fixture.url;
  process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY = fixture.configDirectory;
  process.env.LOWDEFY_JOURNEY_FIXTURE_DATABASE_URI = fixture.uri;
}

export default globalSetup;
