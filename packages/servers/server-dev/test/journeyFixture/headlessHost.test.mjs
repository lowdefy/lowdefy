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

import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';

import { fixtureTest, listMutants, postJourney, postJson } from './fixtureClient.mjs';

// Journeys the dev server runs headless (headless: true on the journey route) on the fixture app:
// no browser, the dev server's own build, data sessions and mutants (lib/docs/createDevServerHost).

const SAVE = {
  pageId: 'home',
  data: 'explore',
  user: 'member',
  state: ['saved', 'name_input'],
  steps: [
    { fill: { blockId: 'name_input', value: 'Headless item' } },
    { click: 'save_button' },
    { wait: { request: 'save_item' } },
    { expect: { state: { path: 'saved', equals: true } } },
  ],
};

const homePage = path.join(
  process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY ?? '',
  'pages',
  'home.yaml'
);

// Posts the journey headless until `until` holds for its result, for a page edit the dev server
// rebuilds on its next read.
async function postHeadlessUntil({ body, until }) {
  const deadline = Date.now() + 60000;
  for (;;) {
    const result = await postJourney({ ...body, headless: true });
    if (until(result) || Date.now() > deadline) return result;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

fixtureTest('a headless journey answers in the shape a browser run of it answers', async () => {
  const browser = await postJourney(SAVE);
  const headless = await postJourney({ ...SAVE, headless: true });
  expect(browser.passed).toBe(true);
  expect(headless.failure).toBeUndefined();
  expect(headless.passed).toBe(true);
  expect(headless.headless).toBe(true);
  expect(headless.pageId).toBe(browser.pageId);
  expect(headless.steps.map(({ status }) => status)).toEqual(
    browser.steps.map(({ status }) => status)
  );
  expect(headless.state).toEqual(browser.state);
  expect(headless.data).toEqual(expect.objectContaining({ name: 'explore' }));
  expect(headless.exercised.pages).toEqual(['home']);
  expect(headless.exercised.requests).toEqual([
    expect.objectContaining({ pageId: 'home', requestId: 'save_item', write: true }),
  ]);
  expect(headless.exercised.events).toContainEqual(
    expect.objectContaining({
      blockId: 'save_button',
      eventName: 'onClick',
      actionIds: ['save', 'set_saved'],
    })
  );
});

fixtureTest(
  'a journey that needs a browser answers browserOnly with the step that does',
  async () => {
    const result = await postJourney({
      ...SAVE,
      headless: true,
      steps: [
        ...SAVE.steps,
        { expect: { text: { blockId: 'save_success', contains: 'Item saved' } } },
      ],
    });
    expect(result).toEqual({
      pageId: 'home',
      browserOnly: {
        index: 4,
        step: { expect: { text: { blockId: 'save_success', contains: 'Item saved' } } },
        reason: 'expect "text" reads the page in a browser',
      },
      steps: [],
    });
  }
);

fixtureTest(
  'a mutant applied through the mutants route fails the headless journey it kills',
  async () => {
    const baseline = await postJourney({ ...SAVE, headless: true });
    expect(baseline.passed).toBe(true);
    const { pages, requests, endpoints, appEvents } = baseline.exercised;
    const listing = await listMutants({
      pages,
      requests: requests.map(({ pageId, requestId }) => ({ pageId, requestId })),
      endpoints: endpoints.map(({ endpointId }) => endpointId),
      appEvents,
    });
    const mutant = listing.mutants.find(
      ({ operator, anchor }) =>
        operator === 'drop-action' && anchor.blockId === 'save_button' && anchor.actionId === 'save'
    );
    const result = await postJourney({
      ...SAVE,
      headless: true,
      mutant: {
        buildId: listing.buildId,
        artifact: mutant.artifact,
        key: mutant.key,
        arg: mutant.arg,
        operator: mutant.operator,
      },
    });
    expect(result.passed).toBe(false);
    expect(result.failure.index).toBe(2);
    expect(result.mutant.applied).toBeGreaterThanOrEqual(1);
  }
);

fixtureTest('an edited page is run by the next headless journey, with no build', async () => {
  const original = fs.readFileSync(homePage, 'utf8');
  const { atime, mtime } = fs.statSync(homePage);
  const edited = original.replace(
    /params:\n {12}saved: true/,
    'params:\n            saved: edited'
  );
  expect(edited).not.toBe(original);
  const expectEdited = {
    ...SAVE,
    steps: [...SAVE.steps.slice(0, 3), { expect: { state: { path: 'saved', equals: 'edited' } } }],
  };
  try {
    fs.writeFileSync(homePage, edited);
    const result = await postHeadlessUntil({ body: expectEdited, until: ({ passed }) => passed });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  } finally {
    fs.writeFileSync(homePage, original);
    // The parity check's production build of the fixture refuses a config file newer than
    // itself, so the restored page keeps its old times.
    fs.utimesSync(homePage, atime, mtime);
  }
  const restored = await postHeadlessUntil({ body: SAVE, until: ({ passed }) => passed });
  expect(restored.passed).toBe(true);
});

fixtureTest('headless must be true or false', async () => {
  const { status, body } = await postJson({
    path: '/lowdefy-docs/journey',
    body: { ...SAVE, headless: 'yes' },
  });
  expect(status).toBe(400);
  expect(body.error).toBe('The "headless" param must be true or false. Received "yes".');
});
