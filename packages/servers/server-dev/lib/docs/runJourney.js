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

import { get, type } from '@lowdefy/helpers';
import {
  getBlock,
  getRequestState,
  getShortcutModifier,
  getState,
} from '@lowdefy/e2e-utils/runtime';

import { getBrowser, openPage, buildPageUrl } from './getBrowser.js';
import isPageReady from './isPageReady.js';
import unsettledPageNote from './unsettledPageNote.js';
import validateJourneySteps, { getStepKey } from './validateJourneySteps.js';

// Carries what a failed step expected and what it found, so the journey's
// failure report can show both. Executors throw it for a failed `expect` and
// for an interaction Playwright refused; the run loop turns it into
// `failure` and stops.
class JourneyStepError extends Error {
  constructor(message, { expected, actual }) {
    super(message);
    this.name = 'JourneyStepError';
    this.expected = expected;
    this.actual = actual;
  }
}

// Structural equality over values that have already been through the JSON
// round-trip getState performs in the page (no undefined, no Dates, no
// functions) — so key order is the only thing that must not matter.
function isDeepEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (type.isArray(a) && type.isArray(b)) {
    return a.length === b.length && a.every((item, index) => isDeepEqual(item, b[index]));
  }
  if (type.isObject(a) && type.isObject(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    return keysA.length === keysB.length && keysA.every((key) => isDeepEqual(a[key], b[key]));
  }
  return false;
}

// Playwright colours its call log with ANSI escapes; the result is read by an
// agent as JSON, where they are noise.
function cleanMessage(error) {
  // eslint-disable-next-line no-control-regex
  return error.message.replace(/\u001b\[[0-9;]*m/g, '');
}

// Wraps a Playwright interaction so a locator that never became actionable
// (missing block, hidden, disabled, detached) reads as "expected the block
// to be actionable, actual: <Playwright's message>" instead of a bare error.
async function actOnBlock({ blockId, action }) {
  try {
    await action();
  } catch (error) {
    const actual = cleanMessage(error);
    throw new JourneyStepError(`Block "${blockId}" was not actionable: ${actual}`, {
      expected: `block "${blockId}" to be actionable`,
      actual,
    });
  }
}

// The #bl-<id> wrapper spans the full row while the control inside it (an
// antd button, a link, a checkbox) is usually narrower, so a click at the
// wrapper's centre can land beside the control. The block's own e2e helpers
// target the inner control for the same reason; a block with no interactive
// descendant (a Box with its own onClick) is clicked directly.
const INTERACTIVE_CONTROL = [
  'button',
  '[role="button"]',
  'a[href]',
  'input:not([type="hidden"])',
  'textarea',
  'select',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
].join(', ');

async function resolveClickTarget(block) {
  const control = block.locator(INTERACTIVE_CONTROL).first();
  if ((await control.count()) > 0) {
    return control;
  }
  return block;
}

async function runClick({ page, step, timeout }) {
  const blockId = step.click;
  await actOnBlock({
    blockId,
    action: async () => {
      const target = await resolveClickTarget(getBlock(page, blockId));
      await target.click({ timeout });
    },
  });
}

async function runFill({ page, step, timeout }) {
  const { blockId, value } = step.fill;
  await actOnBlock({
    blockId,
    action: () =>
      getBlock(page, blockId).locator('input, textarea').first().fill(String(value), { timeout }),
  });
}

// Exact match on the option's text: a regex anchored at both ends, so "Cat"
// does not pick "Category".
function exactText(value) {
  return new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

// A native <select> inside the block is preferred when present (Playwright's
// selectOption is exact and needs no open dropdown). Otherwise the block is
// clicked to open its dropdown and the option with exactly `value` as text is
// clicked — Ant Design renders options into a portal, so they are searched
// page-wide, restricted to visible ones so the hidden accessibility list is
// never matched.
async function runSelect({ page, step, timeout }) {
  const { blockId, value } = step.select;
  const text = String(value);
  const block = getBlock(page, blockId);
  const native = block.locator('select');
  if ((await native.count()) > 0) {
    await actOnBlock({
      blockId,
      action: () => native.first().selectOption({ label: text }, { timeout }),
    });
    return;
  }
  await actOnBlock({
    blockId,
    action: async () => {
      const target = await resolveClickTarget(block);
      await target.click({ timeout });
    },
  });
  const option = page
    .locator('.ant-select-item-option, [role="option"]')
    .filter({ hasText: exactText(text) })
    .filter({ visible: true })
    .first();
  try {
    await option.click({ timeout });
  } catch (error) {
    throw new JourneyStepError(
      `No option with text "${text}" appeared in the dropdown of block "${blockId}".`,
      {
        expected: `option "${text}" in the dropdown of block "${blockId}"`,
        actual: cleanMessage(error),
      }
    );
  }
  // The dropdown fades out for a few hundred ms after a pick; a screenshot or
  // click taken during the fade would still see it covering the rows below.
  // Tolerant and short: a multi-select dropdown stays open by design.
  await page
    .locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)')
    .first()
    .waitFor({ state: 'hidden', timeout: Math.min(timeout, 1000) })
    .catch(() => {});
}

// `Mod` in a chord resolves to Meta or Control from the platform the page
// reports, the way the app's own shortcut handling (tinykeys) does.
async function runPress({ page, step }) {
  const modifier = await getShortcutModifier(page);
  const key = step.press
    .split('+')
    .map((part) => (part === 'Mod' ? modifier : part))
    .join('+');
  try {
    await page.keyboard.press(key);
  } catch (error) {
    throw new JourneyStepError(`Could not press "${key}": ${cleanMessage(error)}`, {
      expected: `key "${key}" to be pressed`,
      actual: cleanMessage(error),
    });
  }
}

// Polls a page read until it satisfies `check`, or fails once `timeout` has
// elapsed. Playwright's own waitForFunction cannot be used here because the
// reads go through the e2e-utils helpers, which run in Node.
async function pollUntil({ page, read, check, timeout, expected }) {
  const deadline = Date.now() + timeout;
  let value = await read();
  while (!check(value)) {
    if (Date.now() >= deadline) {
      throw new JourneyStepError(`Timed out after ${timeout}ms waiting for ${expected}.`, {
        expected,
        actual: value,
      });
    }
    await page.waitForTimeout(50);
    value = await read();
  }
}

async function runWait({ page, step, timeout }) {
  const wait = step.wait;
  switch (getStepKey(wait)) {
    case 'ms':
      await page.waitForTimeout(wait.ms);
      return;
    case 'request':
      await pollUntil({
        page,
        read: () => getRequestState(page, wait.request),
        check: (request) => !type.isNone(request) && request.loading !== true,
        timeout,
        expected: `request "${wait.request}" to have finished loading`,
      });
      return;
    case 'state':
      await pollUntil({
        page,
        read: async () => get((await getState(page)) ?? {}, wait.state),
        check: (value) => !type.isUndefined(value),
        timeout,
        expected: `state "${wait.state}" to be defined`,
      });
      return;
    default:
      return;
  }
}

async function runScreenshot({ page, step, index, screenshots }) {
  const name = type.isString(step.screenshot) ? step.screenshot : `step-${index}`;
  const buffer = await page.screenshot({ type: 'png' });
  screenshots.push({ name, data: buffer.toString('base64'), mimeType: 'image/png' });
}

async function expectState({ page, params }) {
  const { path, equals } = params;
  const actual = get((await getState(page)) ?? {}, path);
  if (!isDeepEqual(actual, equals)) {
    throw new JourneyStepError(
      `Expected state "${path}" to equal ${JSON.stringify(equals)} but found ${JSON.stringify(
        actual
      )}.`,
      { expected: equals, actual }
    );
  }
}

async function expectVisible({ page, params, timeout }) {
  const blockId = params;
  try {
    await getBlock(page, blockId).waitFor({ state: 'visible', timeout });
  } catch (error) {
    throw new JourneyStepError(`Expected block "${blockId}" to be visible.`, {
      expected: `block "${blockId}" to be visible`,
      actual: cleanMessage(error),
    });
  }
}

async function expectText({ page, params, timeout }) {
  const { blockId, contains } = params;
  let text;
  try {
    text = await getBlock(page, blockId).innerText({ timeout });
  } catch (error) {
    throw new JourneyStepError(`Expected block "${blockId}" to contain text "${contains}".`, {
      expected: `block "${blockId}" text to contain "${contains}"`,
      actual: cleanMessage(error),
    });
  }
  if (!text.includes(contains)) {
    throw new JourneyStepError(
      `Expected block "${blockId}" text to contain "${contains}" but found ${JSON.stringify(
        text
      )}.`,
      { expected: `block "${blockId}" text to contain "${contains}"`, actual: text }
    );
  }
}

// Waits for the URL rather than reading it once, because a click that
// navigates resolves before the new route is committed — page.waitForURL is
// Playwright's own wait for exactly this.
async function expectUrl({ page, params, timeout }) {
  const { contains } = params;
  try {
    await page.waitForURL((url) => url.href.includes(contains), { timeout });
  } catch {
    throw new JourneyStepError(
      `Expected url to contain "${contains}" but found ${JSON.stringify(page.url())}.`,
      { expected: `url to contain "${contains}"`, actual: page.url() }
    );
  }
}

async function runExpect({ page, step, timeout }) {
  const expectation = step.expect;
  const key = getStepKey(expectation);
  const params = expectation[key];
  switch (key) {
    case 'state':
      await expectState({ page, params });
      return;
    case 'visible':
      await expectVisible({ page, params, timeout });
      return;
    case 'text':
      await expectText({ page, params, timeout });
      return;
    case 'url':
      await expectUrl({ page, params, timeout });
      return;
    default:
      return;
  }
}

// After an interaction, waits for the page's own load chain — the event the
// interaction fired, the requests it called — to settle, using the same
// readiness check openPage uses, so the next step asserts against the
// outcome rather than racing it. Tolerant: a page that never settles (a
// hung request) simply moves on and lets the next expect report what it
// finds. Reads the current pageId from the page because a click may have
// navigated to another page.
async function settlePage({ page, timeout }) {
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  if (type.isNone(pageId)) {
    return;
  }
  await page.waitForFunction(isPageReady, pageId, { timeout }).catch(() => {});
}

const INTERACTION_STEPS = ['click', 'fill', 'select', 'press'];

async function runStep({ page, step, index, timeout, screenshots }) {
  switch (getStepKey(step)) {
    case 'click':
      await runClick({ page, step, timeout });
      return;
    case 'fill':
      await runFill({ page, step, timeout });
      return;
    case 'select':
      await runSelect({ page, step, timeout });
      return;
    case 'press':
      await runPress({ page, step, timeout });
      return;
    case 'wait':
      await runWait({ page, step, timeout });
      return;
    case 'screenshot':
      await runScreenshot({ page, step, index, screenshots });
      return;
    case 'expect':
      await runExpect({ page, step, timeout });
      return;
    default:
      return;
  }
}

function toFailure({ error, index, step }) {
  if (error instanceof JourneyStepError) {
    // `actual` is null rather than undefined so the key survives JSON — an
    // agent reading the failure sees "found nothing", not a missing field.
    return {
      index,
      step,
      expected: error.expected,
      actual: type.isUndefined(error.actual) ? null : error.actual,
      message: error.message,
    };
  }
  return {
    index,
    step,
    expected: `step ${index} (${getStepKey(step)}) to complete`,
    actual: cleanMessage(error),
    message: cleanMessage(error),
  };
}

// Runs the steps in order, stopping at the first failure. Returns the step
// log, the failure (if any) and the screenshots taken — never throws for a
// step that fails, because a failed journey is a result an agent reads, not
// an error it recovers from.
async function runSteps({ page, steps, stepTimeout }) {
  const results = [];
  const screenshots = [];
  let failure;
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (!type.isUndefined(failure)) {
      results.push({ index, step, status: 'skipped', durationMs: 0 });
      continue;
    }
    const started = Date.now();
    try {
      await runStep({ page, step, index, timeout: stepTimeout, screenshots });
      if (INTERACTION_STEPS.includes(getStepKey(step))) {
        await settlePage({ page, timeout: stepTimeout });
      }
      results.push({ index, step, status: 'ok', durationMs: Date.now() - started });
    } catch (error) {
      failure = toFailure({ error, index, step });
      results.push({ index, step, status: 'failed', durationMs: Date.now() - started });
    }
  }
  return { results, screenshots, failure };
}

// The final state is read even after a failure — it is what an agent needs to
// write the next assertion. A page that has navigated away or crashed may not
// expose one; that is reported rather than thrown.
async function readFinalState({ page }) {
  try {
    return await getState(page);
  } catch (error) {
    return { error: `Could not read final state: ${error.message}` };
  }
}

// runJourney drives a page of the running dev server through a declarative
// list of steps — click, fill, select, press, wait, screenshot, expect — so
// an agent can verify behaviour (a form submits, a modal opens, state
// changes) and not only layout. `timeout` bounds the page open; `stepTimeout`
// bounds each step, matching Playwright's per-action timeout.
async function runJourney({
  origin,
  pageId,
  steps,
  user,
  urlQuery,
  width = 1280,
  height = 800,
  timeout = 15000,
  stepTimeout = 5000,
}) {
  if (type.isNone(origin) || !type.isString(origin)) {
    return {
      error: `runJourney requires an "origin" string. Received ${JSON.stringify(origin)}.`,
    };
  }
  if (type.isNone(pageId) || !type.isString(pageId)) {
    return {
      error: `runJourney requires a "pageId" string. Received ${JSON.stringify(pageId)}.`,
    };
  }
  if (!type.isNone(urlQuery) && !type.isObject(urlQuery)) {
    return {
      error: `runJourney requires "urlQuery" to be an object. Received ${JSON.stringify(
        urlQuery
      )}.`,
    };
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const url = buildPageUrl({ origin, pageId, urlQuery });

  let context;
  try {
    const opened = await openPage({
      browser,
      origin,
      pageId,
      user,
      urlQuery,
      width,
      height,
      timeout,
    });
    context = opened.context;
    const { results, screenshots, failure } = await runSteps({
      page: opened.page,
      steps,
      stepTimeout,
    });
    const state = await readFinalState({ page: opened.page });
    const result = {
      pageId,
      passed: type.isUndefined(failure),
      steps: results,
      screenshots,
      state,
    };
    if (!type.isUndefined(failure)) {
      result.failure = failure;
    }
    // openPage already waited for the page's async lifecycle; an unsettled page
    // still runs its steps and reports `ready: false` alongside the result.
    if (!opened.ready) {
      return { ...result, ready: false, note: unsettledPageNote({ timeout }) };
    }
    return result;
  } catch (error) {
    return { error: `Failed to run journey at "${url}": ${error.message}` };
  } finally {
    if (context) {
      await context.close();
    }
  }
}

export default runJourney;
