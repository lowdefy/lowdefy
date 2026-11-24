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
import YAML from 'yaml';

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
// rebuilds on its next read. It posts past postJourney's parity check: the check runs the journey
// on a production build of the fixture, which refuses a page edited after it was built.
async function postHeadlessUntil({ body, until }) {
  const deadline = Date.now() + 60000;
  for (;;) {
    const { status, body: result } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { user: 'none', ...body, headless: true },
    });
    if (status !== 200) {
      throw new Error(`Journey route answered ${status}: ${JSON.stringify(result)}`);
    }
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
      steps: [...SAVE.steps, { expect: { title: { contains: 'home' } } }],
    });
    expect(result).toEqual({
      pageId: 'home',
      browserOnly: {
        index: 4,
        step: { expect: { title: { contains: 'home' } } },
        reason: 'expect "title" reads the page in a browser',
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

// A journey of tests/journeys/_headless, as the journey route takes it: the file's first, or the
// one at `index`.
function readHeadlessJourney(name, index = 0) {
  const file = path.join(
    process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY ?? '',
    'tests',
    'journeys',
    '_headless',
    name
  );
  const journey = YAML.parse(fs.readFileSync(file, 'utf8'))[index];
  return {
    pageId: journey.pageId,
    data: journey.data,
    user: journey.user,
    stubs: journey.stubs,
    steps: journey.steps,
  };
}

// tests/journeys/_headless/race.yaml: hold parks the first approve_run call before claim_run, the
// other user's call claims the run, and release answers with the parked call. A browser run
// refuses hold and release before any browser opens.
function readRaceJourney() {
  return readHeadlessJourney('race.yaml');
}

fixtureTest(
  'the race journey parks the held call and releases it, headless on the dev server',
  async () => {
    const race = readRaceJourney();
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { ...race, headless: true },
    });
    expect(status).toBe(200);
    expect(body.failure).toBeUndefined();
    expect(body.passed).toBe(true);
    expect(body.steps.map((step) => step.status)).toEqual(race.steps.map(() => 'ok'));
  }
);

// tests/journeys/_headless/system.yaml and webhook.yaml: the InternalApi close_runs answers only a
// call as system, and payment_events' verify gate passes the signed bodies and refuses the wrong
// signature (the dev server is given the test secret the signatures are computed with).
// stubs.yaml: an answer stub stands in for the rate service and fail gates fail writes once, twice
// and every time; expect.error reads each forced message the dev server recorded.
fixtureTest.each([['system.yaml'], ['webhook.yaml'], ['stubs.yaml']])(
  'the %s journey passes headless on the dev server',
  async (name) => {
    const journey = readHeadlessJourney(name);
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { ...journey, headless: true },
    });
    expect(status).toBe(200);
    expect(body.failure).toBeUndefined();
    expect(body.passed).toBe(true);
    expect(body.steps.map((step) => step.status)).toEqual(journey.steps.map(() => 'ok'));
  }
);

// The second journey of tests/journeys/_headless/webhook.yaml: a fail gate fails the event write
// inside payment_events, whose 500 names no request id; expect.error reads the forced message by
// the request id the dev server host answers the webhook with.
fixtureTest(
  'expect.error reads a forced failure inside a webhook, headless on the dev server',
  async () => {
    const journey = readHeadlessJourney('webhook.yaml', 1);
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { ...journey, headless: true },
    });
    expect(status).toBe(200);
    expect(body.failure).toBeUndefined();
    expect(body.passed).toBe(true);
    expect(body.steps.map((step) => step.status)).toEqual(journey.steps.map(() => 'ok'));
  }
);

// The third journey of tests/journeys/_headless/webhook.yaml: caught_webhook's routine catches the
// ConfigError its verify step's request schema raises, and answers 200. The dev server host marks
// the fault caught, so it fails no step (lib/docs/createDevServerHost.test.mjs checks the mark).
fixtureTest(
  'a webhook whose routine catches a fault passes, headless on the dev server',
  async () => {
    const journey = readHeadlessJourney('webhook.yaml', 2);
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { ...journey, headless: true },
    });
    expect(status).toBe(200);
    expect(body.failure).toBeUndefined();
    expect(body.passed).toBe(true);
    expect(body.steps.map((step) => step.status)).toEqual(journey.steps.map(() => 'ok'));
  }
);

fixtureTest(
  'a fail gate that never fired fails the journey headless on the dev server',
  async () => {
    const journey = readHeadlessJourney('stubs.yaml');
    const steps = journey.steps.slice(0, 2);
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: {
        ...journey,
        stubs: [...journey.stubs, { requestId: 'insert_activity', fail: 'Never reached' }],
        steps,
        headless: true,
      },
    });
    expect(status).toBe(200);
    expect(body.passed).toBe(false);
    expect(body.failure).toMatchObject({
      index: 1,
      message:
        'The forced failure on request "claim_run" on endpoint "approve_run" ("Claim failed on purpose") never fired: no request the journey made matched it, so nothing tested what it fails.',
    });
  }
);

fixtureTest(
  'an answer stub that never answered fails the journey headless on the dev server',
  async () => {
    const journey = readHeadlessJourney('stubs.yaml');
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: {
        ...journey,
        stubs: [
          journey.stubs[0],
          {
            connectionType: 'AxiosHttp',
            requestType: 'AxiosHttp',
            requestId: 'never_sent',
            answer: null,
          },
        ],
        steps: journey.steps.slice(3, 5),
        headless: true,
      },
    });
    expect(status).toBe(200);
    expect(body.passed).toBe(false);
    expect(body.failure).toMatchObject({
      index: 1,
      message:
        'The AxiosHttp/AxiosHttp stub on request "never_sent" never answered: no request the journey made matched it, or an earlier stub answered first, so nothing used its answer. A stub that names its request (requestId, endpoint, pageId or match) must answer; one keyed only by connectionType and requestType is a fallback and may go unused.',
    });
  }
);

fixtureTest('the journey route refuses stubs with no data set', async () => {
  const journey = readHeadlessJourney('stubs.yaml');
  const { status, body } = await postJson({
    path: '/lowdefy-docs/journey',
    body: { stubs: journey.stubs, steps: journey.steps, headless: true },
  });
  expect(status).toBe(400);
  expect(body.error).toBe(
    'Journey "stubs" need a data set: stubs and forced failures live on the journey\'s data session. Give the journey a "data".'
  );
});

fixtureTest('a browser run refuses the race journey, pointing to a headless run', async () => {
  const { status, body } = await postJson({
    path: '/lowdefy-docs/journey',
    body: readRaceJourney(),
  });
  expect(status).toBe(400);
  expect(body.error).toBe(
    'Step 0: step "hold" needs the headless runner, which keeps a held call parked in its own process. A browser run cannot take it: run the journey headless (lowdefy test --headless, or lowdefy_run_journey with headless: true).'
  );
});

fixtureTest('a browser run refuses the system journey, pointing to a headless run', async () => {
  const { status, body } = await postJson({
    path: '/lowdefy-docs/journey',
    body: readHeadlessJourney('system.yaml'),
  });
  expect(status).toBe(400);
  expect(body.error).toBe(
    'Step 3: step "call" as system needs the headless runner, which runs the endpoint as the system in its own process; over HTTP that is the detached route, which needs CRON_SECRET. A browser run cannot take it: run the journey headless (lowdefy test --headless, or lowdefy_run_journey with headless: true).'
  );
});

fixtureTest(
  'a page request a click fires and a fail gate fails is no app error, headless on the dev server',
  async () => {
    const journey = readHeadlessJourney('stubs.yaml', 1);
    const { status, body } = await postJson({
      path: '/lowdefy-docs/journey',
      body: { ...journey, headless: true },
    });
    expect(status).toBe(200);
    expect(body.failure).toBeUndefined();
    expect(body.passed).toBe(true);
    expect(body.steps.map((step) => step.status)).toEqual(journey.steps.map(() => 'ok'));
  }
);
