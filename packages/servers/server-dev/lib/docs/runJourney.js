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

import { EXPECT_TEXT_KEYS, findIncompleteExpectation } from '@lowdefy/node-utils';

import { getBrowser, openPage, buildPageUrl, deterministicContextOptions } from './getBrowser.js';
import isPageReady from './isPageReady.js';
import seedFixture from './seedFixture.js';
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

// A block's root spans the full row while the control inside it (an antd
// button, a link, a checkbox) is usually narrower, so a click at the root's
// centre can land beside the control. The block's own e2e helpers
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

// Runs in the page. Writes through the block's own `setValue`, which enforces
// the block's valueType, clears its schema errors and re-renders — the same
// path a user typing into the block takes, and the only path that reaches a
// block whose editable surface is not an <input>.
function setValueInPage({ pageId, blockId, value }) {
  const context = window.lowdefy?.contexts?.['page:' + pageId];
  if (!context) {
    return { outcome: 'noContext' };
  }
  const block = context._internal?.RootSlots?.map?.[blockId];
  if (!block) {
    return { outcome: 'noBlock' };
  }
  if (typeof block.setValue !== 'function') {
    return { outcome: 'notInput', blockType: block.type };
  }
  block.setValue(value);
  return { outcome: 'set' };
}

// `window.lowdefy` is only exposed for the dev and e2e stages, so a journey
// driving state through the engine can never be replayed against a production
// build — the dev server is the only host of this verb.
async function setBlockValue({ page, blockId, value, verb }) {
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  const { outcome, blockType } = await page.evaluate(setValueInPage, { pageId, blockId, value });
  if (outcome === 'set') {
    return;
  }
  if (outcome === 'noContext') {
    throw new JourneyStepError(
      `Step "${verb}" could not reach the Lowdefy context of page "${pageId}".`,
      { expected: `page "${pageId}" to expose its Lowdefy context`, actual: null }
    );
  }
  if (outcome === 'noBlock') {
    throw new JourneyStepError(`Block "${blockId}" is not on page "${pageId}".`, {
      expected: `block "${blockId}" on page "${pageId}"`,
      actual: null,
    });
  }
  throw new JourneyStepError(
    `Block "${blockId}" has type "${blockType}", which is not an input block, so "${verb}" has no value to write. Use "click" for a block that is not an input.`,
    { expected: `block "${blockId}" to be an input block`, actual: blockType ?? null }
  );
}

// `fill` drives the widget the way a user does. A block with no <input> or
// <textarea> inside it (a rich-text editor, a Slider, an AgGrid cell) has no
// surface to type into, so it falls back to `set` semantics.
async function runFill({ page, step, timeout }) {
  const { blockId, value } = step.fill;
  const input = getBlock(page, blockId).locator('input, textarea').first();
  if ((await input.count()) === 0) {
    await setBlockValue({ page, blockId, value, verb: 'fill' });
    return;
  }
  await actOnBlock({
    blockId,
    action: () => input.fill(String(value), { timeout }),
  });
}

async function runSet({ page, step }) {
  const { blockId, value } = step.set;
  await setBlockValue({ page, blockId, value, verb: 'set' });
}

// Exact match on the option's text: a regex anchored at both ends, so "Cat"
// does not pick "Category".
function exactText(value) {
  return new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

const OPEN_DROPDOWN = '.ant-select-dropdown:not(.ant-select-dropdown-hidden)';
const OPTION = '.ant-select-item-option, [role="option"]';

// Ant Design renders options into a portal at the end of the body, so a second
// open select (or a portal still fading out) puts two option lists in the DOM.
// The dropdown the click just opened is the last one rendered, so options are
// looked up inside it. A block with no antd dropdown (a plain listbox) has none,
// and the search falls back to the page.
async function resolveOptionScope(page) {
  const dropdown = page.locator(OPEN_DROPDOWN).last();
  if ((await dropdown.count()) > 0) {
    return dropdown;
  }
  return page;
}

// A native <select> inside the block is preferred when present (Playwright's
// selectOption is exact and needs no open dropdown). Otherwise the block is
// clicked to open its dropdown and the option with exactly `value` as text is
// clicked, restricted to visible options so the hidden accessibility list is
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
  const scope = await resolveOptionScope(page);
  const option = scope
    .locator(OPTION)
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
    .locator(OPEN_DROPDOWN)
    .last()
    .waitFor({ state: 'hidden', timeout: Math.min(timeout, 1000) })
    .catch(() => {});
}

// `Mod` in a chord resolves to Meta or Control from the platform the page
// reports, the way the app's own shortcut handling (tinykeys) does.
async function resolveChord({ page, key }) {
  const modifier = await getShortcutModifier(page);
  return key
    .split('+')
    .map((part) => (part === 'Mod' ? modifier : part))
    .join('+');
}

// A bare string presses on the page, for an app-level shortcut. { blockId, key }
// presses on the block's own control, which is what a keydown handler bound to
// one input needs.
async function runPress({ page, step, timeout }) {
  const params = step.press;
  const blockId = type.isString(params) ? undefined : params.blockId;
  const key = await resolveChord({ page, key: type.isString(params) ? params : params.key });
  if (!type.isNone(blockId)) {
    await actOnBlock({
      blockId,
      action: async () => {
        const target = await resolveClickTarget(getBlock(page, blockId));
        await target.press(key, { timeout });
      },
    });
    return;
  }
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

// Wraps a read of the rendered block so a block that never appeared reads as
// the expectation it defeated rather than as a bare Playwright timeout.
async function readFromBlock({ expected, read }) {
  try {
    return await read();
  } catch (error) {
    throw new JourneyStepError(`Expected ${expected}.`, {
      expected,
      actual: cleanMessage(error),
    });
  }
}

const TEXT_CLAIMS = {
  contains: 'to contain',
  equals: 'to equal',
  notContains: 'not to contain',
};

// `equals` compares the trimmed innerText: blocks wrap their content in
// elements that add surrounding whitespace, which is never what an author
// means by "the text is X".
function isTextMatched({ form, text, value }) {
  if (form === 'equals') {
    return text.trim() === value;
  }
  if (form === 'notContains') {
    return !text.includes(value);
  }
  return text.includes(value);
}

async function expectText({ page, params, timeout }) {
  const { blockId } = params;
  const form = EXPECT_TEXT_KEYS.find((key) => !type.isUndefined(params[key]));
  const value = params[form];
  const expected = `block "${blockId}" text ${TEXT_CLAIMS[form]} "${value}"`;
  const text = await readFromBlock({
    expected,
    read: () => getBlock(page, blockId).innerText({ timeout }),
  });
  if (!isTextMatched({ form, text, value })) {
    throw new JourneyStepError(`Expected ${expected} but found ${JSON.stringify(text)}.`, {
      expected,
      actual: text,
    });
  }
}

// One claim about the block's rendered element: a class it holds, a class it
// does not hold, a descendant selector that must match, or an attribute value.
// This is what `expect.text` and `expect.visible` cannot see — a disabled
// button, a primary style, an aria state.
async function expectDom({ page, params, timeout }) {
  const { blockId, hasClass, notHasClass, matches, attribute, equals } = params;
  const block = getBlock(page, blockId);
  if (!type.isUndefined(matches)) {
    const expected = `block "${blockId}" to contain an element matching "${matches}"`;
    const count = await readFromBlock({
      expected,
      read: () => block.locator(matches).count(),
    });
    if (count === 0) {
      throw new JourneyStepError(`Expected ${expected} but nothing matched.`, {
        expected,
        actual: 0,
      });
    }
    return;
  }
  if (!type.isUndefined(attribute)) {
    const expected = `block "${blockId}" attribute "${attribute}" to equal "${equals}"`;
    const actual = await readFromBlock({
      expected,
      read: () => block.getAttribute(attribute, { timeout }),
    });
    if (actual !== equals) {
      throw new JourneyStepError(`Expected ${expected} but found ${JSON.stringify(actual)}.`, {
        expected,
        actual,
      });
    }
    return;
  }
  const claimed = type.isUndefined(hasClass) ? notHasClass : hasClass;
  const claim = type.isUndefined(hasClass) ? 'not to have class' : 'to have class';
  const expected = `block "${blockId}" ${claim} "${claimed}"`;
  const className = await readFromBlock({
    expected,
    read: () => block.getAttribute('class', { timeout }),
  });
  const classes = (className ?? '').split(/\s+/).filter((name) => name !== '');
  const held = classes.includes(claimed);
  const matched = type.isUndefined(hasClass) ? !held : held;
  if (!matched) {
    throw new JourneyStepError(`Expected ${expected} but found ${JSON.stringify(className)}.`, {
      expected,
      actual: className,
    });
  }
}

// The previous step's recorded duration, which includes the settle wait after
// an interaction — the number the result already reports, so a journey can pin
// a regression in how long a flow takes.
function expectDurationMsUnder({ params, index, results }) {
  const previous = results[index - 1];
  const expected = `step ${index - 1} to take less than ${params}ms`;
  if (previous.durationMs >= params) {
    throw new JourneyStepError(`Expected ${expected} but it took ${previous.durationMs}ms.`, {
      expected,
      actual: previous.durationMs,
    });
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

async function runExpect({ page, step, timeout, index, results }) {
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
    case 'dom':
      await expectDom({ page, params, timeout });
      return;
    default:
      expectDurationMsUnder({ params, index, results });
  }
}

async function readPageId(page) {
  return page.evaluate(() => window.lowdefy?.pageId);
}

// A navigating interaction resolves before the new route is committed, so
// `window.lowdefy.pageId` is still the page that is being torn down. Waiting on
// readiness for that id would never settle and would burn the whole step
// timeout on every navigating click, so the navigation is awaited first: a
// changed URL means the page id must change too, and only then is readiness
// checked against whatever page is now open.
const NAVIGATION_TIMEOUT = 2000;

async function settleNavigation({ page, timeout, before }) {
  if (page.url() === before.url) {
    return;
  }
  await page
    .waitForFunction((previous) => window.lowdefy?.pageId !== previous, before.pageId, {
      timeout: Math.min(timeout, NAVIGATION_TIMEOUT),
    })
    .catch(() => {});
}

// After an interaction, waits for the page's own load chain — the event the
// interaction fired, the requests it called — to settle, using the same
// readiness check openPage uses, so the next step asserts against the
// outcome rather than racing it. Tolerant: a page that never settles (a
// hung request) simply moves on and lets the next expect report what it
// finds.
async function settlePage({ page, timeout, before }) {
  await settleNavigation({ page, timeout, before });
  const pageId = await readPageId(page);
  if (type.isNone(pageId)) {
    return;
  }
  await page.waitForFunction(isPageReady, pageId, { timeout }).catch(() => {});
}

const INTERACTION_STEPS = ['click', 'fill', 'set', 'select', 'press'];

async function runStep({ page, step, index, timeout, screenshots, results }) {
  switch (getStepKey(step)) {
    case 'click':
      await runClick({ page, step, timeout });
      return;
    case 'fill':
      await runFill({ page, step, timeout });
      return;
    case 'set':
      await runSet({ page, step });
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
    default:
      await runExpect({ page, step, timeout, index, results });
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
    const interaction = INTERACTION_STEPS.includes(getStepKey(step));
    try {
      const before = interaction ? { pageId: await readPageId(page), url: page.url() } : undefined;
      await runStep({ page, step, index, timeout: stepTimeout, screenshots, results });
      if (interaction) {
        await settlePage({ page, timeout: stepTimeout, before });
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

// The rows a journey needs before its page opens, seeded through the same
// connection layer and the same write gate as lowdefy_seed_fixture. `reset` so
// the journey starts from the fixture's rows rather than from whatever the last
// run left; a refusal or a failed insert stops the journey before a browser
// shows a page built on the wrong data.
async function seedJourneyFixtures({ fixtures, honoContext }) {
  for (const name of fixtures) {
    const result = await seedFixture({ name, reset: true, honoContext });
    if (result.refused === true) {
      return `Could not seed fixture "${name}": ${result.reason} ${result.howToEnable}`;
    }
    if (!type.isNone(result.error)) {
      return `Could not seed fixture "${name}": ${result.error.message}`;
    }
  }
  return undefined;
}

// runJourney drives a page of the running dev server through a declarative
// list of steps — click, fill, set, select, press, wait, screenshot, expect — so
// an agent can verify behaviour (a form submits, a modal opens, state
// changes) and not only layout. `timeout` bounds the page open; `stepTimeout`
// bounds each step, matching Playwright's per-action timeout.
async function runJourney({
  fixtures = [],
  honoContext,
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
  if (!type.isArray(fixtures) || fixtures.some((name) => !type.isString(name))) {
    return {
      error: `runJourney requires "fixtures" to be an array of fixture names. Received ${JSON.stringify(
        fixtures
      )}.`,
    };
  }
  const { error: stepsError } = validateJourneySteps({ steps });
  if (!type.isUndefined(stepsError)) {
    return { error: stepsError };
  }
  // An expectation with a path and no value asserts nothing, so it is refused
  // rather than reported as a step that passed; only `lowdefy test --update`
  // fills it.
  const incomplete = findIncompleteExpectation({ steps });
  if (!type.isUndefined(incomplete)) {
    return { error: incomplete.message };
  }

  let browser;
  try {
    browser = await getBrowser();
  } catch (error) {
    return {
      error: `No Chromium available. Run: npx playwright install chromium (${error.message})`,
    };
  }

  const seedError = await seedJourneyFixtures({ fixtures, honoContext });
  if (!type.isUndefined(seedError)) {
    return { error: seedError };
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
      contextOptions: deterministicContextOptions,
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

export { runSteps };
export default runJourney;
