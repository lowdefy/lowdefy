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

import { afterAll, beforeAll, beforeEach, expect, test } from 'vitest';

import createBuildHost from '../../src/createBuildHost.js';
import runHeadlessJourney from '../../src/runHeadlessJourney.js';
import journeyFixture from './journeyFixture.mjs';

// The headless runner over a production build of apps/journey-fixture: whole journeys, their
// steps on the client engine in Node, their checks, and app errors judged as the browser runner
// judges them.

let host;

beforeAll(async () => {
  host = await createBuildHost({ ...journeyFixture, data: 'harden', user: 'member' });
});

beforeEach(() => {
  host.errorSink.errors.splice(0);
});

afterAll(async () => {
  await host?.close();
});

// The page config comes in its serialized form, where an array is { '~arr': [...] }.
function items(value) {
  return value?.['~arr'] ?? value ?? [];
}

function findBlockConfig(config, blockId) {
  if (config.blockId === blockId) return config;
  for (const slot of Object.values(config.slots ?? {})) {
    for (const block of items(slot.blocks)) {
      const found = findBlockConfig(block, blockId);
      if (found) return found;
    }
  }
  return undefined;
}

function firstAction(blockConfig) {
  return items(blockConfig.events.onClick.try)[0];
}

// The fixture host with the home page's config changed as `change` says, for a case the fixture
// app has no block for. The build and the app are left as they are.
function withHomeChanged(change) {
  return {
    ...host,
    readPageConfig: async (args) => {
      const page = await host.readPageConfig(args);
      if (page.pageId === 'home') {
        change(page.pageConfig);
      }
      return page;
    },
  };
}

function run({ journey, runHost = host }) {
  return runHeadlessJourney({ host: runHost, journey, stepTimeout: 2000 });
}

test('a fill, click, wait and expect journey passes, with its call recorded', async () => {
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [
        { fill: { blockId: 'name_input', value: 'Runner item' } },
        { click: 'save_button' },
        { wait: { request: 'save_item' } },
        { expect: { visible: 'save_success' } },
        { expect: { state: { path: 'saved', equals: true } } },
        { expect: { calls: { request: 'save_item', count: 1 } } },
        { expect: { hidden: 'hidden_text' } },
      ],
    },
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
  expect(result.steps.map((step) => step.status)).toEqual(Array(7).fill('ok'));
  expect(result.state.name_input).toBe('Runner item');
  expect(result.calls).toEqual([
    expect.objectContaining({
      actor: 'main',
      kind: 'request',
      requestId: 'save_item',
      payload: { name: 'Runner item' },
      status: 200,
    }),
  ]);
});

test('a failed check fails the journey at its step with what it expected and found', async () => {
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [
        { click: 'count_button' },
        { expect: { state: { path: 'clicks', equals: 2 } } },
        { click: 'count_button' },
      ],
    },
  });
  expect(result.passed).toBe(false);
  expect(result.failure).toEqual({
    index: 1,
    step: { expect: { state: { path: 'clicks', equals: 2 } } },
    expected: 2,
    actual: 1,
    message: 'Expected state "clicks" to equal 2 but found 1.',
  });
  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'failed', 'skipped']);
});

test('a Link, goto and back move between pages, and expect url follows them', async () => {
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [
        { click: 'link_button' },
        { expect: { url: { contains: '/second' } } },
        { expect: { visible: 'second_title' } },
        { back: true },
        { expect: { url: { contains: '/home' } } },
        { goto: 'second' },
        { click: 'second_save_button' },
        { expect: { calls: { request: 'save_item', count: 1 } } },
        { expect: { calls: { request: 'save_item', pageId: 'home', count: 0 } } },
        { back: true },
        { expect: { visible: 'home_title' } },
      ],
    },
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

test('a CallMethod opens and closes a Modal, and its content shows only while it is open', async () => {
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [
        { expect: { hidden: 'modal_text' } },
        { click: 'open_modal_button' },
        { expect: { visible: 'modal_text' } },
        { click: 'close_modal_button' },
        { expect: { hidden: 'modal_text' } },
        { expect: { hidden: 'forced_text' } },
      ],
    },
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

test('a CallMethod on a method no stand-in registers fails the journey naming the block and method', async () => {
  const runHost = withHomeChanged((pageConfig) => {
    firstAction(findBlockConfig(pageConfig, 'open_modal_button')).params = {
      blockId: 'home_title',
      method: 'scrollIntoView',
    };
  });
  const result = await run({
    journey: { pageId: 'home', steps: [{ click: 'open_modal_button' }] },
    runHost,
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.message).toContain(
    'Failed to call method "scrollIntoView" on block "home_title"'
  );
});

test('an action only a browser can carry out marks the journey browser-only, not failed', async () => {
  // Logout is the fixture's one auth action, so the build's actions.js holds it.
  const runHost = withHomeChanged((pageConfig) => {
    firstAction(findBlockConfig(pageConfig, 'count_button')).type = 'Logout';
  });
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [{ click: 'save_button' }, { click: 'count_button' }, { click: 'save_button' }],
    },
    runHost,
  });
  expect(result.passed).toBeUndefined();
  expect(result.failure).toBeUndefined();
  expect(result.browserOnly).toEqual({
    index: 1,
    step: { click: 'count_button' },
    reason: 'Logout needs the browser.',
  });
  expect(result.steps.map((step) => step.status)).toEqual(['ok', 'browser-only', 'skipped']);
});

test('a journey whose steps need a browser is not run and names the first such step', async () => {
  const result = await run({
    journey: {
      pageId: 'home',
      steps: [{ click: 'save_button' }, { click: { text: 'Save' } }],
    },
  });
  expect(result).toEqual({
    pageId: 'home',
    browserOnly: {
      index: 1,
      step: { click: { text: 'Save' } },
      reason: 'a target by "text" reads the page; a headless run targets blocks by blockId',
    },
    steps: [],
  });
});

test('expected outcomes pass, and an app error fails the journey unless expect.error claims it', async () => {
  const passes = await run({
    journey: {
      pageId: 'app_errors',
      steps: [
        { click: 'throw_button' },
        { click: 'auditor_button' },
        { expect: { visible: 'auditor_status' } },
      ],
    },
  });
  expect(passes.failure).toBeUndefined();
  expect(passes.passed).toBe(true);

  const fails = await run({
    journey: { pageId: 'app_errors', steps: [{ click: 'bad_payload_button' }] },
  });
  expect(fails.passed).toBe(false);
  expect(fails.failure).toMatchObject({ index: 0, kind: 'app-error' });
  expect(fails.failure.errors.map((error) => error.kind)).toContain('action-error');

  const claimed = await run({
    journey: {
      pageId: 'app_errors',
      steps: [{ click: 'bad_payload_button' }, { expect: { error: 'quantity' } }],
    },
  });
  expect(claimed.failure).toBeUndefined();
  expect(claimed.passed).toBe(true);
});
