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

import { chromium } from 'playwright-core';

import startJourneyFixture from '../../../../../scripts/lib/startJourneyFixture.mjs';

async function canLaunchChromium() {
  for (const options of [{ channel: 'chrome' }, {}]) {
    try {
      const browser = await chromium.launch(options);
      await browser.close();
      return true;
    } catch {
      // Try the next install.
    }
  }
  return false;
}

// Vite compiles the client on its first page load, which can outlast a
// journey's page-open timeout; the warm-up takes that hit, so no test does.
async function warmUpPage({ url, pageId, blockId }) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${url}/lowdefy-docs/journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pageId,
          user: 'none',
          steps: [{ expect: { visible: blockId } }],
        }),
      });
      const result = await response.json();
      if (result.passed === true) {
        return;
      }
      lastError = new Error(JSON.stringify(result));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

// Every page is built on its first visit, and a page that builds mid-journey
// can reset the page a step just acted on; the warm-up builds them all.
async function warmUp({ url }) {
  await warmUpPage({ url, pageId: 'home', blockId: 'home_title' });
  await warmUpPage({ url, pageId: 'second', blockId: 'second_title' });
}

// Starts apps/journey-fixture once for every fixture test file, and hands its
// url to the test workers through the environment they inherit. With no
// Chromium the server is not started and every test skips.
async function globalSetup() {
  if (!(await canLaunchChromium())) {
    process.env.LOWDEFY_JOURNEY_FIXTURE_SKIP = 'No Chromium could be launched.';
    return;
  }
  const fixture = await startJourneyFixture({
    port: Number(process.env.LOWDEFY_JOURNEY_FIXTURE_PORT ?? 3300),
  });
  globalThis.__lowdefyJourneyFixture = fixture;
  try {
    await warmUp({ url: fixture.url });
  } catch (error) {
    await fixture.stop();
    throw error;
  }
  process.env.LOWDEFY_JOURNEY_FIXTURE_URL = fixture.url;
  process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY = fixture.configDirectory;
  process.env.LOWDEFY_JOURNEY_FIXTURE_DATABASE_URI = fixture.uri;
}

export default globalSetup;
