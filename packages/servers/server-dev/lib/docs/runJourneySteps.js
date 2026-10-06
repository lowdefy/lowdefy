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

import { get, journeyTargetSelectors, type } from '@lowdefy/helpers';
import {
  getBlock,
  getRequestState,
  getShortcutModifier,
  getState,
} from '@lowdefy/e2e-utils/runtime';
import { getStepKey } from '@lowdefy/node-utils';

import createLeftOriginError from './createLeftOriginError.js';
import { buildPageUrl } from './getBrowser.js';
import isPageReady from './isPageReady.js';
import JourneyStepError from './JourneyStepError.js';
import openJourneyEmail from './openJourneyEmail.js';
import readJourneyEmailMatch from './readJourneyEmailMatch.js';

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
async function actOnTarget({ target, action }) {
  try {
    await action();
  } catch (error) {
    if (error instanceof JourneyStepError) {
      throw error;
    }
    const actual = cleanMessage(error);
    const description = describeTarget(target);
    throw new JourneyStepError(`${capitalise(description)} was not actionable: ${actual}`, {
      expected: `${description} to be actionable`,
      actual,
    });
  }
}

function capitalise(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// The #bl-<id> wrapper spans the full row while the control inside it (an
// antd button, a link, a checkbox) is usually narrower, so a click at the
// wrapper's centre can land beside the control. The block's own e2e helpers
// target the inner control for the same reason; a block with no interactive
// descendant (a Box with its own onClick) is clicked directly.
//
// A radio or checkbox inside a <label> is reached through the label: the label
// carries the option's text and is what a person clicks, while the input may
// have no size at all (antd Segmented hides it at zero width and height), so
// Playwright would never find it visible. The selectors live in
// @lowdefy/helpers, where the engine's describe functions read them too.
const {
  cellAttribute: CELL_ATTRIBUTE,
  dropdownOption: DROPDOWN_OPTION,
  interactiveControl: INTERACTIVE_CONTROL,
  layers: LAYERS,
  radioOption: RADIO_OPTION,
  rowAttribute: ROW_ATTRIBUTE,
} = journeyTargetSelectors;

async function resolveClickTarget(scope) {
  const control = scope.locator(INTERACTIVE_CONTROL).first();
  if ((await control.count()) > 0) {
    return control;
  }
  return scope;
}

// Exact match on a control's or option's text: a regex anchored at both ends,
// so "Cat" does not pick "Category".
function exactText(value) {
  return new RegExp(`^\\s*${value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
}

// A step's target is a blockId string or an object narrowing the search (see
// validateJourneySteps). The string form is the object form with only blockId.
function normaliseTarget(target) {
  if (type.isString(target)) {
    return { blockId: target };
  }
  return target;
}

// The block, row and column a target is narrowed to, as describeTarget reads them.
function describeScopeParts(target) {
  const parts = [];
  if (!type.isUndefined(target.blockId)) {
    parts.push(`block "${target.blockId}"`);
  }
  if (!type.isUndefined(target.row)) {
    parts.push(`row ${target.row}`);
  }
  if (!type.isUndefined(target.column)) {
    parts.push(`column "${target.column}"`);
  }
  return parts;
}

// Reads back the way an author thinks of it — `block "grid" row 1 control
// "Edit"` — for the expected/actual pair of a failed step.
function describeTarget(target) {
  const parts = describeScopeParts(target);
  if (!type.isUndefined(target.text)) {
    parts.push(`control "${target.text}"`);
  }
  if (!type.isUndefined(target.containing)) {
    parts.push(`text containing "${target.containing}"`);
  }
  if (!type.isUndefined(target.nth)) {
    parts.push(`nth ${target.nth}`);
  }
  return parts.join(' ');
}

function attributeValue(value) {
  return `"${String(value).replace(/["\\]/g, '\\$&')}"`;
}

// The element the target's scope keys name: the block wrapper, narrowed to a
// grid row (`.ag-row[row-index]`, the row as displayed, which ag-grid renders
// once per pinned/centre column container) and to a cell (`.ag-cell[col-id]`,
// the column's field or colId). Undefined for a page-wide `text` target,
// which has no scope narrower than the page.
function resolveScope({ page, target }) {
  if (type.isUndefined(target.blockId)) {
    return undefined;
  }
  let scope = getBlock(page, target.blockId);
  if (!type.isUndefined(target.row)) {
    scope = scope.locator(`.ag-row[${ROW_ATTRIBUTE}=${attributeValue(target.row)}]`);
  }
  if (!type.isUndefined(target.column)) {
    scope = scope.locator(`.ag-cell[${CELL_ATTRIBUTE}=${attributeValue(target.column)}]`);
  }
  return scope;
}

function controlsWithText({ root, text }) {
  return root
    .locator(INTERACTIVE_CONTROL)
    .filter({ hasText: exactText(text) })
    .filter({ visible: true });
}

// LAYERS are the portal layers, front-most first. A control found by text alone is looked
// for in the front-most open layer before the page, the way a person reads a
// screen: an open dropdown menu covers a dialog, a dialog covers the page. A
// confirm dialog's "Delete" is then found over the grid's "Delete" cell
// buttons behind its mask, without the author counting buttons.
async function locatePageWideText({ page, target }) {
  for (const layer of LAYERS) {
    const open = page.locator(layer).filter({ visible: true });
    if ((await open.count()) > 0) {
      const inLayer = controlsWithText({ root: open.last(), text: target.text });
      if ((await inLayer.count()) > 0) {
        return { matches: inLayer, where: 'the front-most open layer' };
      }
    }
  }
  return { matches: controlsWithText({ root: page, text: target.text }), where: 'the page' };
}

function namesMatches(target) {
  return !type.isUndefined(target.text) || !type.isUndefined(target.containing);
}

// Every visible element a `text` or `containing` target matches, before `nth`
// picks one, and where they were looked for. With `containing` they are the
// elements whose text contains the string, inside the scope or on the page: a
// list row a person picks by the name or address it shows, which is neither a
// block nor an interactive control. With `text` they are the interactive
// controls with exactly that text (a cell button, a confirm dialog's OK, a
// menu item) inside the scope, or in the front-most open layer of the page
// when there is no blockId — portal-rendered controls live outside every
// block.
async function locateMatches({ page, target }) {
  const scope = resolveScope({ page, target });
  const where = type.isUndefined(scope) ? 'the page' : describeScopeParts(target).join(' ');
  if (!type.isUndefined(target.containing)) {
    return {
      matches: (scope ?? page).getByText(target.containing).filter({ visible: true }),
      where,
    };
  }
  if (type.isUndefined(scope)) {
    return locatePageWideText({ page, target });
  }
  return { matches: controlsWithText({ root: scope, text: target.text }), where };
}

// The element an expectation asserts about, or an action acts on when its
// target needs no single-match check (it gives `nth`, or names no `text` or
// `containing`). A `text` or `containing` target is its nth match, the first
// when no `nth` is given: an expectation holds for any match.
// With `nth` alone it is the nth interactive control in the scope. Otherwise
// it is the scope itself, and a click resolves its inner control the way a
// plain blockId click does.
async function resolveTarget({ page, target }) {
  if (namesMatches(target)) {
    const { matches } = await locateMatches({ page, target });
    return matches.nth(target.nth ?? 0);
  }
  const scope = resolveScope({ page, target });
  if (!type.isUndefined(target.nth)) {
    return scope.locator(INTERACTIVE_CONTROL).nth(target.nth);
  }
  return scope;
}

function plural({ count, word }) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// The element an action step (click, open, fill, select) acts on. A `text` or
// `containing` target with no `nth` must name exactly one visible element:
// acting on the first of several is a guess, and a guess that happens to pass
// hides a journey that clicks the wrong row. Waits for a first match to show,
// then looks again (a dialog may have opened over the page in the meantime) and
// counts. When none shows, the wait's own error reports it.
async function resolveActionTarget({ page, target, timeout }) {
  if (!namesMatches(target) || !type.isUndefined(target.nth)) {
    return resolveTarget({ page, target });
  }
  const first = (await locateMatches({ page, target })).matches.first();
  await first.waitFor({ state: 'visible', timeout });
  const { matches, where } = await locateMatches({ page, target });
  const count = await matches.count();
  if (count > 1) {
    const noun = type.isUndefined(target.text) ? 'element' : 'control';
    const named = type.isUndefined(target.text)
      ? `containing "${target.containing}"`
      : `with text "${target.text}"`;
    throw new JourneyStepError(
      `Matched ${plural({ count, word: noun })} ${named} in ${where}; add nth: 0..${
        count - 1
      }, or a blockId/row to narrow it.`,
      {
        expected: `exactly one ${noun} ${named} in ${where}`,
        actual: plural({ count, word: noun }),
      }
    );
  }
  return matches.first();
}

// A target that names a control (`text`, `nth`) or the words shown
// (`containing`) is clicked as is - a click on a list row's text reaches the
// row's own click handler, the way a person clicks the row; a target that
// names a container (block, row, cell) is clicked on the first control inside
// it, or on itself when it has none.
async function resolveClickLocator({ located, target }) {
  if (namesMatches(target) || !type.isUndefined(target.nth)) {
    return located;
  }
  return resolveClickTarget(located);
}

// The element a person clicks to open an input's popup: the trigger antd draws
// inside the block. Every popup input - Select, MultipleSelector, AutoComplete,
// TreeSelector, Cascader (all `.ant-select`, whose clickable box antd 6 renders
// as `.ant-select-content`), the date and time pickers (`.ant-picker`), a
// colour picker, a dropdown button - has one.
const POPUP_TRIGGER = [
  '.ant-select-content',
  '.ant-picker',
  '.ant-color-picker-trigger',
  '.ant-dropdown-trigger',
  '.ant-mentions',
].join(', ');

// The popups those triggers open. antd mounts them in a portal at the end of
// <body>, so they are looked for page-wide; the hidden class marks a popup
// that has closed but is still in the DOM.
const POPUP = [
  '.ant-select-dropdown:not(.ant-select-dropdown-hidden)',
  '.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)',
  '.ant-cascader-dropdown:not(.ant-select-dropdown-hidden)',
  '.ant-color-picker-inner',
  '.ant-dropdown:not(.ant-dropdown-hidden)',
  '.ant-mentions-dropdown:not(.ant-mentions-dropdown-hidden)',
];

// Marks the popups already showing before an `open` step clicks, so the step
// waits for a popup its own click opened: the dropdown a previous step opened
// stays visible while it fades out, and would otherwise pass for the new one.
const SHOWING_BEFORE = 'data-lowdefy-journey-showing-before';

const NEW_POPUP = POPUP.map((selector) => `${selector}:not([${SHOWING_BEFORE}])`).join(', ');

async function markShowingPopups({ page }) {
  await page
    .locator(POPUP.join(', '))
    .evaluateAll(
      (popups, attribute) =>
        popups
          .filter((popup) => popup.checkVisibility())
          .forEach((popup) => popup.setAttribute(attribute, '')),
      SHOWING_BEFORE
    );
}

// The marks come off once the step is done, so a later `open` of the same
// input finds its popup again.
async function unmarkPopups({ page }) {
  await page
    .locator(`[${SHOWING_BEFORE}]`)
    .evaluateAll(
      (popups, attribute) => popups.forEach((popup) => popup.removeAttribute(attribute)),
      SHOWING_BEFORE
    );
}

// Opens the popup of the input the target names and waits until it shows, so
// a screenshot or a `select`-less inspection sees the options. A block with no
// popup trigger (a button) is clicked as `click` does; a block whose click
// opens nothing fails the step, since `open` promises a popup.
async function runOpen({ page, step, timeout }) {
  const target = normaliseTarget(step.open);
  await markShowingPopups({ page });
  try {
    await actOnTarget({
      target,
      action: async () => {
        const located = await resolveActionTarget({ page, target, timeout });
        const trigger = located.locator(POPUP_TRIGGER).first();
        if ((await trigger.count()) > 0) {
          await trigger.click({ timeout });
        } else {
          await (await resolveClickLocator({ located, target })).click({ timeout });
        }
      },
    });
    const popup = page.locator(NEW_POPUP).filter({ visible: true }).first();
    try {
      await popup.waitFor({ state: 'visible', timeout });
    } catch (error) {
      const description = describeTarget(target);
      throw new JourneyStepError(`Opening ${description} showed no dropdown or popup.`, {
        expected: `a popup to open from ${description}`,
        actual: cleanMessage(error),
      });
    }
  } finally {
    await unmarkPopups({ page });
  }
  // Popups animate in; a capture mid-animation is faded or offset.
  await page.waitForTimeout(250);
}

// `count` clicks in quick succession through one Playwright click, as a
// person's double click: the runner's settle comes after all of them, so a
// double click is never turned into a second submit after the first settled.
async function runClick({ page, step, timeout }) {
  const { count = 1, ...target } = normaliseTarget(step.click);
  await actOnTarget({
    target,
    action: async () => {
      const located = await resolveActionTarget({ page, target, timeout });
      const locator = await resolveClickLocator({ located, target });
      await locator.click({ timeout, clickCount: count });
    },
  });
}

// A fill types `value`, or text read from an email (`fromEmail`) - the way a
// person types a one-time code from their inbox into the tab they started in.
async function runFill({ journey, page, step, timeout }) {
  const { value: literal, fromEmail, ...target } = step.fill;
  let value = literal;
  if (!type.isUndefined(fromEmail)) {
    value = await readJourneyEmailMatch({
      page,
      params: fromEmail,
      since: journey.startedAt,
      configDirectory: journey.configDirectory,
      timeout,
    });
  }
  await actOnTarget({
    target,
    action: async () => {
      const located = await resolveActionTarget({ page, target, timeout });
      await located.locator('input, textarea').first().fill(String(value), { timeout });
    },
  });
}

// The options of a radio group, a button selector or a segmented control are
// all on the page already: the one labelled `text` is clicked, no dropdown.
async function selectRadioOption({ options, target, text, timeout }) {
  const option = options
    .filter({ hasText: exactText(text) })
    .filter({ visible: true })
    .first();
  try {
    await option.click({ timeout });
  } catch (error) {
    const description = describeTarget(target);
    throw new JourneyStepError(`No option with text "${text}" in ${description}.`, {
      expected: `option "${text}" in ${description}`,
      actual: cleanMessage(error),
    });
  }
}

// A native <select> inside the block is preferred when present (Playwright's
// selectOption is exact and needs no open dropdown), then radio options
// labelled in the block. Otherwise the block is clicked to open its dropdown
// and the option with exactly `value` as text is clicked — Ant Design renders
// options into a portal, so they are searched page-wide, restricted to visible
// ones so the hidden accessibility list is never matched.
async function runSelect({ page, step, timeout }) {
  const { value, ...target } = step.select;
  const text = String(value);
  let scope;
  await actOnTarget({
    target,
    action: async () => {
      scope = await resolveActionTarget({ page, target, timeout });
    },
  });
  const native = scope.locator('select');
  if ((await native.count()) > 0) {
    await actOnTarget({
      target,
      action: () => native.first().selectOption({ label: text }, { timeout }),
    });
    return;
  }
  const radioOptions = scope.locator(RADIO_OPTION);
  if ((await radioOptions.count()) > 0) {
    await selectRadioOption({ options: radioOptions, target, text, timeout });
    return;
  }
  await actOnTarget({
    target,
    action: async () => {
      const locator = await resolveClickLocator({ located: scope, target });
      await locator.click({ timeout });
    },
  });
  const option = page
    .locator(DROPDOWN_OPTION)
    .filter({ hasText: exactText(text) })
    .filter({ visible: true })
    .first();
  try {
    await option.click({ timeout });
  } catch (error) {
    const description = describeTarget(target);
    throw new JourneyStepError(
      `No option with text "${text}" appeared in the dropdown of ${description}.`,
      {
        expected: `option "${text}" in the dropdown of ${description}`,
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

// Goes back one entry in the browser history, the way the Back button does.
// The headless tab opens on about:blank before the journey's page, which the
// Navigation API leaves out of the app's entries, so an entry index of 0 means
// the journey has not navigated anywhere it could go back from.
async function runBack({ page, timeout }) {
  const index = await page.evaluate(() => window.navigation.currentEntry.index);
  if (index === 0) {
    throw new JourneyStepError(
      'There is no earlier page in this journey to go back to: back needs a page the journey navigated from.',
      { expected: 'the browser to go back one page', actual: `no earlier page than ${page.url()}` }
    );
  }
  try {
    await page.goBack({ timeout });
  } catch (error) {
    throw new JourneyStepError(`Could not go back: ${cleanMessage(error)}`, {
      expected: 'the browser to go back one page',
      actual: cleanMessage(error),
    });
  }
}

// Loads an app page the way a typed URL does. The page shown may not be the
// one asked for - a protected page redirects a signed-out actor to sign in -
// so the runner settles whichever page the app mounts (isPageReady with a
// null pageId, as openPage does) and lets the next step assert where it
// landed.
async function runGoto({ page, step, origin, timeout }) {
  const { pageId, urlQuery } = type.isString(step.goto) ? { pageId: step.goto } : step.goto;
  const url = buildPageUrl({ origin, pageId, urlQuery });
  try {
    await page.goto(url, { waitUntil: 'load', timeout });
  } catch (error) {
    throw new JourneyStepError(`Could not open page "${pageId}": ${cleanMessage(error)}`, {
      expected: `page "${pageId}" to load`,
      actual: cleanMessage(error),
    });
  }
  await page.waitForFunction(isPageReady, null, { timeout }).catch(() => {});
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

// A path that does not exist reads as null: a journey is JSON, where null is
// the only way to say "absent", and the failure report already shows a
// missing value as null - so `equals: null` asserts the value is not there.
// A read while the page navigates fails and is retried.
async function readStateValue({ page, path }) {
  try {
    return { value: get((await getState(page)) ?? {}, path) ?? null };
  } catch (error) {
    return { error };
  }
}

// Polled like every other expectation: the value a click leads to often
// lands once the request or endpoint it called has answered, which can be
// after the page has settled on a busy machine.
async function expectState({ page, params, timeout }) {
  const { path, equals } = params;
  const deadline = Date.now() + timeout;
  let read = await readStateValue({ page, path });
  while (
    (!type.isUndefined(read.error) || !isDeepEqual(read.value, equals)) &&
    Date.now() < deadline
  ) {
    await page.waitForTimeout(50);
    read = await readStateValue({ page, path });
  }
  if (!type.isUndefined(read.error)) {
    throw read.error;
  }
  if (!isDeepEqual(read.value, equals)) {
    throw new JourneyStepError(
      `Expected state "${path}" to equal ${JSON.stringify(equals)} but found ${JSON.stringify(
        read.value
      )}.`,
      { expected: equals, actual: read.value }
    );
  }
}

async function expectVisible({ page, params, timeout }) {
  const target = normaliseTarget(params);
  const description = describeTarget(target);
  try {
    const located = await resolveTarget({ page, target });
    await located.waitFor({ state: 'visible', timeout });
  } catch (error) {
    throw new JourneyStepError(`Expected ${description} to be visible.`, {
      expected: `${description} to be visible`,
      actual: cleanMessage(error),
    });
  }
}

// Passes once no element the target names is visible: nothing matches, or
// every match is hidden. Resolves at once when nothing matches yet, so a
// journey pairs it with something that must be present first.
async function expectHidden({ page, params, timeout }) {
  const target = normaliseTarget(params);
  const description = describeTarget(target);
  try {
    const located = await resolveTarget({ page, target });
    await located.filter({ visible: true }).first().waitFor({ state: 'hidden', timeout });
  } catch (error) {
    throw new JourneyStepError(`Expected ${description} to be hidden.`, {
      expected: `${description} to be hidden`,
      actual: cleanMessage(error),
    });
  }
}

// Counts the calls the current actor's browser made to one request or
// endpoint since the journey started, from the network counter, which keeps
// its counts across full page loads. Compared once, after the page settles,
// without polling: "not called" can only be judged once the moment has passed.
// A request with no pageId is counted on the page the actor is on; when no
// Lowdefy page is showing (it crashed or left the app) the step fails, since a
// count of 0 against no page would pass without proving anything.
async function expectCalls({ journey, page, params }) {
  await settlePage({ page, timeout: Math.min(journey.stepTimeout, SETTLE_TIMEOUT_MS) });
  let query;
  let description;
  if (type.isUndefined(params.endpoint)) {
    const pageId = params.pageId ?? (await page.evaluate(() => window.lowdefy?.pageId));
    if (type.isNone(pageId)) {
      throw new JourneyStepError(
        `Expected request "${params.request}" to be counted on the current page, but no Lowdefy page is showing.`,
        { expected: `a Lowdefy page to count request "${params.request}" on`, actual: null }
      );
    }
    query = { request: params.request, pageId };
    description = `request "${params.request}" on page "${pageId}"`;
  } else {
    query = { endpoint: params.endpoint };
    description = `endpoint "${params.endpoint}"`;
  }
  const actual = journey.actors.countCalls(query);
  if (actual !== params.count) {
    throw new JourneyStepError(
      `Expected ${description} to have been called ${plural({
        count: params.count,
        word: 'time',
      })} but it was called ${plural({ count: actual, word: 'time' })}.`,
      { expected: params.count, actual }
    );
  }
}

// Waits for the target to be in the page, then reads the text of every element
// it matches. A grid row is rendered once per column container (pinned left,
// centre, pinned right), so a row target legitimately matches more than one
// element; joining them reads the whole row.
async function readTargetText({ page, target, timeout }) {
  const located = await resolveTarget({ page, target });
  await located.first().waitFor({ state: 'attached', timeout });
  const texts = await located.allInnerTexts();
  return texts.join('\n');
}

// One read of the target's text: { text } or, when the target is not in the
// page yet or the page navigated mid-read, { error }.
async function tryReadTargetText({ page, target, timeout }) {
  try {
    return { text: await readTargetText({ page, target, timeout }) };
  } catch (error) {
    return { error };
  }
}

// Polled rather than read once, like the url and the title: a block often
// renders its text only once the request it shows has answered (a list hidden
// until its data arrives reads as ""), and a sign-in or sign-out may still be
// reloading the page when the step starts.
async function expectText({ page, params, timeout }) {
  const { contains, ...target } = params;
  const description = describeTarget(target);
  const expected = `${description} text to contain "${contains}"`;
  const deadline = Date.now() + timeout;
  let read = await tryReadTargetText({ page, target, timeout });
  while (read.text?.includes(contains) !== true && Date.now() < deadline) {
    await page.waitForTimeout(50);
    read = await tryReadTargetText({
      page,
      target,
      timeout: Math.max(deadline - Date.now(), 1),
    });
  }
  if (!type.isUndefined(read.error)) {
    throw new JourneyStepError(`Expected ${description} to contain text "${contains}".`, {
      expected,
      actual: cleanMessage(read.error),
    });
  }
  if (!read.text.includes(contains)) {
    throw new JourneyStepError(
      `Expected ${description} text to contain "${contains}" but found ${JSON.stringify(
        read.text
      )}.`,
      { expected, actual: read.text }
    );
  }
}

// The document title is set by the page after it renders, so it is polled
// rather than read once.
async function expectTitle({ page, params, timeout }) {
  if (!type.isUndefined(params.equals)) {
    await pollUntil({
      page,
      read: () => page.title(),
      check: (title) => title === params.equals,
      timeout,
      expected: `title to equal "${params.equals}"`,
    });
    return;
  }
  await pollUntil({
    page,
    read: () => page.title(),
    check: (title) => title.includes(params.contains),
    timeout,
    expected: `title to contain "${params.contains}"`,
  });
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

async function runExpect({ journey, page, step, timeout }) {
  const expectation = step.expect;
  const key = getStepKey(expectation);
  const params = expectation[key];
  switch (key) {
    case 'state':
      await expectState({ page, params, timeout });
      return;
    case 'visible':
      await expectVisible({ page, params, timeout });
      return;
    case 'hidden':
      await expectHidden({ page, params, timeout });
      return;
    case 'calls':
      await expectCalls({ journey, page, params });
      return;
    case 'text':
      await expectText({ page, params, timeout });
      return;
    case 'url':
      await expectUrl({ page, params, timeout });
      return;
    case 'title':
      await expectTitle({ page, params, timeout });
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
//
// Never longer than SETTLE_TIMEOUT_MS, however long the steps may wait: an
// event that ends in a Wait (a sign-in link's resend cooldown) keeps the page
// unsettled for as long as it waits, and every step after it waits for what it
// needs on its own.
async function settlePage({ page, timeout }) {
  const pageId = await page.evaluate(() => window.lowdefy?.pageId);
  if (type.isNone(pageId)) {
    return;
  }
  await page.waitForFunction(isPageReady, pageId, { timeout }).catch(() => {});
}

const INTERACTION_STEPS = ['click', 'open', 'fill', 'select', 'press', 'back'];

const SETTLE_TIMEOUT_MS = 5000;

async function runStep({ journey, step, index, screenshots }) {
  const page = journey.actors.current().page;
  const timeout = journey.stepTimeout;
  switch (getStepKey(step)) {
    case 'click':
      await runClick({ page, step, timeout });
      return;
    case 'open':
      await runOpen({ page, step, timeout });
      return;
    case 'fill':
      await runFill({ journey, page, step, timeout });
      return;
    case 'select':
      await runSelect({ page, step, timeout });
      return;
    case 'press':
      await runPress({ page, step, timeout });
      return;
    case 'back':
      await runBack({ page, timeout });
      return;
    case 'goto':
      await runGoto({ page, step, origin: journey.origin, timeout: journey.openTimeout });
      return;
    case 'email':
      await openJourneyEmail({
        page,
        params: step.email,
        since: journey.startedAt,
        configDirectory: journey.configDirectory,
        timeout,
      });
      return;
    case 'as':
      await journey.actors.switchTo(step.as);
      return;
    case 'wait':
      await runWait({ page, step, timeout });
      return;
    case 'screenshot':
      await runScreenshot({ page, step, index, screenshots });
      return;
    case 'expect':
      await runExpect({ journey, page, step, timeout });
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
async function runJourneySteps({ journey, steps }) {
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
      await runStep({ journey, step, index, screenshots });
      if (INTERACTION_STEPS.includes(getStepKey(step))) {
        await settlePage({
          page: journey.actors.current().page,
          timeout: Math.min(journey.stepTimeout, SETTLE_TIMEOUT_MS),
        });
      }
      await journey.actors.sampleRendered();
      results.push({ index, step, status: 'ok', durationMs: Date.now() - started });
    } catch (error) {
      failure = toFailure({ error, index, step });
      results.push({ index, step, status: 'failed', durationMs: Date.now() - started });
    }
    // A request this step caused to another host of the dev server was aborted, so whatever the
    // step saw afterwards is not what the app does: that request is the failure.
    const departure = journey.actors.leftOrigin();
    if (!type.isUndefined(departure)) {
      failure = toFailure({
        error: createLeftOriginError({ origin: journey.origin, departure }),
        index,
        step,
      });
      results[results.length - 1].status = 'failed';
    }
  }
  return { results, screenshots, failure };
}

export default runJourneySteps;
