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

// What every fixture test file shares: the fixture server's url (set by
// globalSetup.mjs), a test function that skips when there is no server, and
// the two docs routes the tests drive.
const fixtureUrl = process.env.LOWDEFY_JOURNEY_FIXTURE_URL;
const fixtureTest = fixtureUrl === undefined ? test.skip : test;

async function postJson({ path, body }) {
  const response = await fetch(`${fixtureUrl}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}

async function postJourney(body) {
  const { status, body: result } = await postJson({
    path: '/lowdefy-docs/journey',
    body: { user: 'none', ...body },
  });
  if (status !== 200) {
    throw new Error(`Journey route answered ${status}: ${JSON.stringify(result)}`);
  }
  return result;
}

async function listMutants(body) {
  const { status, body: result } = await postJson({ path: '/lowdefy-docs/mutants', body });
  if (status !== 200) {
    throw new Error(`Mutants route answered ${status}: ${JSON.stringify(result)}`);
  }
  return result;
}

// A system Chrome first, as the dev server's own renderer launches.
async function launchChromium() {
  try {
    return await chromium.launch({ channel: 'chrome' });
  } catch {
    return await chromium.launch();
  }
}

export { fixtureTest, launchChromium, fixtureUrl, listMutants, postJourney, postJson };
