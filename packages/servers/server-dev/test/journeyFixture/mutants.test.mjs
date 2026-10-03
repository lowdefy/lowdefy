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

import {
  fixtureTest,
  fixtureUrl,
  launchChromium,
  listMutants,
  postJourney,
} from './fixtureClient.mjs';

// Config mutants applied to one journey's browsers on the real fixture app:
// the mutated artifact reaches the page, request and endpoint routes, and the
// detached loopback call, while a context without the cookie is served the
// unmutated app. That the registry closes each run is pinned by the journey
// route's unit tests: the run lives in the dev server's process.

const SAVE_JOURNEY = [
  { fill: { blockId: 'name_input', value: 'Mutant item' } },
  { click: 'save_button' },
  { wait: { request: 'save_item' } },
  { expect: { text: { blockId: 'save_success', contains: 'Item saved' } } },
];

const NOTIFY_JOURNEY = [
  { click: 'notify_button' },
  { expect: { visible: 'notified_text' } },
  // The detached target runs after its 202; give it time to read its config
  // while the mutant run is still open.
  { wait: { ms: 1500 } },
];

async function mutantsFor(steps) {
  const baseline = await postJourney({ pageId: 'home', steps });
  expect(baseline.passed).toBe(true);
  const { pages, requests, endpoints, appEvents } = baseline.exercised;
  return listMutants({
    pages,
    requests: requests.map(({ pageId, requestId }) => ({ pageId, requestId })),
    endpoints: endpoints.map(({ endpointId }) => endpointId),
    appEvents,
  });
}

function findMutant({ listing, operator, match }) {
  const mutant = listing.mutants.find(
    (candidate) => candidate.operator === operator && match(candidate)
  );
  if (mutant === undefined) {
    throw new Error(
      `No ${operator} mutant matched. Listed: ${listing.mutants
        .map((candidate) => candidate.describe)
        .join('; ')}`
    );
  }
  return mutant;
}

function runWithMutant({ steps, listing, mutant }) {
  return postJourney({
    pageId: 'home',
    steps,
    mutant: {
      buildId: listing.buildId,
      artifact: mutant.artifact,
      key: mutant.key,
      arg: mutant.arg,
      operator: mutant.operator,
    },
  });
}

fixtureTest('dropping the save action kills the journey that asserts its message', async () => {
  const listing = await mutantsFor(SAVE_JOURNEY);
  const mutant = findMutant({
    listing,
    operator: 'drop-action',
    match: ({ anchor }) => anchor.blockId === 'save_button' && anchor.actionId === 'save',
  });
  const result = await runWithMutant({ steps: SAVE_JOURNEY, listing, mutant });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(2);
  expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
  expect(result.mutant.misses).toEqual([]);
});

fixtureTest('dropping an alert no journey asserts survives, applied', async () => {
  const listing = await mutantsFor(SAVE_JOURNEY);
  const mutant = findMutant({
    listing,
    operator: 'drop-block',
    match: ({ anchor }) => anchor.blockId === 'unasserted_alert',
  });
  expect(mutant.source).toMatch(/pages\/home\.yaml:\d+$/);
  const result = await runWithMutant({ steps: SAVE_JOURNEY, listing, mutant });
  expect(result.passed).toBe(true);
  expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
});

fixtureTest(
  'a step dropped from an endpoint reached only by a detached CallApi applies',
  async () => {
    const listing = await mutantsFor(NOTIFY_JOURNEY);
    const mutant = findMutant({
      listing,
      operator: 'drop-step',
      match: ({ artifact }) => artifact === 'api/detached_log.json',
    });
    const result = await runWithMutant({ steps: NOTIFY_JOURNEY, listing, mutant });
    expect(result.passed).toBe(true);
    expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
  }
);

fixtureTest(
  'a context without the cookie sees the unmutated page during a mutant run',
  async () => {
    const listing = await mutantsFor(SAVE_JOURNEY);
    const mutant = findMutant({
      listing,
      operator: 'drop-block',
      match: ({ anchor }) => anchor.blockId === 'unasserted_alert',
    });
    const browser = await launchChromium();
    try {
      const running = runWithMutant({
        steps: [...SAVE_JOURNEY, { wait: { ms: 3000 } }],
        listing,
        mutant,
      });
      // Opened while the journey's browsers carry the mutant.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const page = await browser.newPage();
      await page.goto(`${fixtureUrl}/home`);
      const pageConfig = await page.evaluate(() =>
        fetch('/api/page/home').then((response) => response.text())
      );
      const result = await running;
      expect(result.passed).toBe(true);
      expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
      expect(pageConfig).toContain('unasserted_alert');
    } finally {
      await browser.close();
    }
  }
);
