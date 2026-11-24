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

import { type } from '@lowdefy/helpers';

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import checkHeadlessRails from './checkHeadlessRails.js';
import collectBlockParents from './collectBlockParents.js';
import findContentTrigger from './findContentTrigger.js';
import hasEventActions from './hasEventActions.js';
import HeadlessStepError from './HeadlessStepError.js';
import leaveDropdowns from './leaveDropdowns.js';
import listBlockAncestors from './listBlockAncestors.js';
import pollUntil from './pollUntil.js';
import readStandInState from './readStandInState.js';
import readTextTarget from './readTextTarget.js';
import describeBlock from './standIns/describeBlock.js';
import loadHtmlDom from './standIns/loadHtmlDom.js';
import waitForShownBlock from './waitForShownBlock.js';

const BROWSER = 'the step runs in a browser';

// Whether a step's target names what the page shows, a `text` or `containing` target, which a
// headless run looks for in the ClickableHtml blocks it shows (readTextTarget).
function isTextTarget(target) {
  return (
    type.isObject(target) &&
    (Object.hasOwn(target, 'text') || Object.hasOwn(target, 'containing')) &&
    !['row', 'rowKey', 'column', 'control'].some((key) => Object.hasOwn(target, key))
  );
}

function describeNamed(target) {
  return type.isUndefined(target.containing)
    ? { noun: 'control', named: `with text "${target.text}"` }
    : { noun: 'element', named: `containing "${target.containing}"` };
}

function describeWhere(target) {
  return type.isUndefined(target.blockId) ? 'the page' : `block "${target.blockId}"`;
}

function capitalise(text) {
  return `${text[0].toUpperCase()}${text.slice(1)}`;
}

function plural({ count, word }) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function describeMatch(match) {
  return `${match.description} in ${describeBlock(match.block)}`;
}

// Why a reading leaves the step to the browser, or undefined: the layer a browser looks in first
// is not known, or what matches depends on what a headless page cannot read.
function readBrowserReason(read) {
  if (read.layer !== null) {
    return `${read.layer}: ${BROWSER}.`;
  }
  if (read.uncertain !== null) {
    return `In a ClickableHtml, ${read.uncertain}: ${BROWSER}.`;
  }
  return undefined;
}

function describeShown(target) {
  return type.isUndefined(target.containing)
    ? `the text "${target.text}"`
    : `text containing "${target.containing}"`;
}

function describeOther({ read, target }) {
  return `${capitalise(read.other)} may show ${describeShown(
    target
  )}, and a headless run reads text only in ClickableHtml blocks: ${BROWSER}.`;
}

function describeNone({ target }) {
  const { noun, named } = describeNamed(target);
  return `No ClickableHtml element in ${describeWhere(
    target
  )} shows a ${noun} ${named}; another block may: ${BROWSER}.`;
}

// Matches in more than one place (two ClickableHtml blocks, or a block's html and its popover)
// sit where antd puts them, whose order a headless page does not know, so `nth` cannot pick one.
function spansPlaces(matches) {
  return new Set(matches.map((match) => `${match.block.id} ${match.where}`)).size > 1;
}

// The one element a click by text or containing lands on, as the browser runner's
// resolveActionTarget picks it: the nth match, else the only one; several with no nth fail,
// naming them. Pushes why the step needs a browser to actor.browserOnly and resolves undefined
// instead, when the reading cannot tell: no ClickableHtml shows it (another block may), another
// block may show it too, or the matches' order, their layer or their text is not known.
function pickMatch({ actor, read, target }) {
  const reason = readBrowserReason(read);
  if (!type.isUndefined(reason)) {
    actor.browserOnly.push(reason);
    return undefined;
  }
  const { matches } = read;
  const { noun, named } = describeNamed(target);
  const where = describeWhere(target);
  if (type.isUndefined(target.nth) && matches.length > 1) {
    throw new HeadlessStepError(
      `Matched ${plural({ count: matches.length, word: noun })} ${named} in ${where}; add nth: 0..${
        matches.length - 1
      }, or a blockId/row to narrow it. They are: ${matches.map(describeMatch).join('; ')}.`,
      {
        expected: `exactly one ${noun} ${named} in ${where}`,
        actual: plural({ count: matches.length, word: noun }),
      }
    );
  }
  if (read.other !== null) {
    actor.browserOnly.push(describeOther({ read, target }));
    return undefined;
  }
  if (matches.length === 0) {
    actor.browserOnly.push(describeNone({ target }));
    return undefined;
  }
  if (type.isUndefined(target.nth)) {
    return matches[0];
  }
  if (spansPlaces(matches)) {
    actor.browserOnly.push(
      `Matches for nth ${target.nth} sit in ${matches
        .map(describeMatch)
        .join('; ')}, whose order on the page a headless run does not know: ${BROWSER}.`
    );
    return undefined;
  }
  if (target.nth >= matches.length) {
    throw new HeadlessStepError(
      `No ${noun} ${named} at nth ${target.nth} in ${where}: it matched ${plural({
        count: matches.length,
        word: noun,
      })}.`,
      {
        expected: `a ${noun} ${named} at nth ${target.nth} in ${where}`,
        actual: plural({ count: matches.length, word: noun }),
      }
    );
  }
  return matches[target.nth];
}

// Reads the target until a ClickableHtml shows a match (the nth, with nth), or what it read says
// where else to look, for at most `timeout` ms, as the browser waits for a first match to show
// and its click waits for the nth. With no ClickableHtml in the scope there is nothing to wait
// for, and the step goes to the browser at once.
async function waitForReading({ actor, parse, target, timeout }) {
  const cache = new Map();
  const { value } = await pollUntil({
    check: (read) =>
      (read.scopeShown !== false && read.htmlBlocks === 0) ||
      read.matches.length > (target.nth ?? 0) ||
      read.other !== null ||
      read.layer !== null ||
      read.uncertain !== null,
    read: () => readTextTarget({ actor, cache, parse, target }),
    timeout,
  });
  return value;
}

// Why a click on the match reaches a block a headless run does not fire it on, or undefined. A
// DropdownMenu whose content holds the block hears the click on its trigger. A block around it
// with onClick actions fires its onClick too (the engine's claimDomEvent) unless the click fires
// a data-event with actions that does not bubble, in the block's own html: one in a popover or
// confirm is drawn in a portal, off the DOM path the engine checks, while React still bubbles it.
function readReachReason({ actor, description, match }) {
  const { block } = match;
  const trigger = findContentTrigger({ actor, block });
  if (trigger !== null) {
    return `${description} sits in the content of ${describeBlock(
      trigger
    )}, whose trigger hears the click: ${BROWSER}.`;
  }
  const { action } = match;
  const claimed =
    match.where === 'html' &&
    action.kind === 'event' &&
    !action.confirm &&
    hasEventActions({ block, name: action.dataEvent.name }) &&
    block.Events.events[action.dataEvent.name].bubble !== true;
  if (claimed) {
    return undefined;
  }
  const { parents } = collectBlockParents({ context: actor.page.context });
  const around = listBlockAncestors({ block, parents }).find((ancestor) =>
    hasEventActions({ block: ancestor, name: 'onClick' })
  );
  if (type.isUndefined(around)) {
    return undefined;
  }
  return `A click on ${description} reaches ${describeBlock(
    around
  )} too, whose onClick a headless run does not fire for it: ${BROWSER}.`;
}

// A click by `text` or `containing` (LDF-1146): the element it lands on in a ClickableHtml
// (readTextTarget, pickMatch) gets the click through the block's stand-in (clickMatch), after
// the other open dropdowns hear the pointer leave, and on a data-set journey once the rails allow
// a click on its block. A match behind an open popup's mask, or one whose click a headless run
// does not model, leaves the step to the browser. The block it landed on is where the pointer
// rests (pressEscape), and the control it landed on is recorded for lint L8 (landedControl).
async function clickText({ actor, rails, step, stepTimeout }) {
  const target = step.click;
  if (!type.isUndefined(target.blockId)) {
    await waitForShownBlock({ actor, target, timeout: stepTimeout });
  }
  const parse = await loadHtmlDom();
  const read = await waitForReading({ actor, parse, target, timeout: stepTimeout });
  const match = pickMatch({ actor, read, target });
  if (type.isUndefined(match)) {
    return;
  }
  const description = describeMatch(match);
  if (read.behind(match)) {
    actor.browserOnly.push(
      `${description} sits behind an open popup's mask, which takes a browser's click: ${BROWSER}.`
    );
    return;
  }
  if (match.action.kind === 'browser') {
    actor.browserOnly.push(
      `A click on ${description} lands where ${match.action.reason}: ${BROWSER}.`
    );
    return;
  }
  if (match.action.kind === 'disabled') {
    throw new HeadlessStepError(`${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled ${describeNamed(target).noun}`,
    });
  }
  const reachReason = readReachReason({ actor, description, match });
  if (!type.isUndefined(reachReason)) {
    actor.browserOnly.push(reachReason);
    return;
  }
  const { block } = match;
  checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'click' });
  actor.page.pointerBlockId = block.blockId;
  await leaveDropdowns({ actor, except: block, targetBlock: block });
  await BLOCK_STAND_INS[block.type].clickMatch({
    actor,
    block,
    match,
    state: readStandInState({ actor, block }),
  });
  await actor.settle();
}

// expect.visible or expect.hidden by `text` or `containing` (LDF-1146), as the browser reads the
// nth match (the first without nth): visible holds once more than nth matches show, hidden while
// no more than nth do. The ClickableHtml blocks' matches count at least what a browser counts, so
// visible holds and hidden fails on them alone. Visible with no such match, or hidden while
// another block may show the text, leaves the step to the browser: the text may be another
// block's.
async function expectText({ actor, kind, target, timeout }) {
  const parse = await loadHtmlDom();
  const nth = target.nth ?? 0;
  const cache = new Map();
  const read = () => readTextTarget({ actor, cache, parse, target });
  const decided = (reading) => !type.isUndefined(readBrowserReason(reading));
  const { noun, named } = describeNamed(target);
  const description = `the ${noun} ${named}${
    type.isUndefined(target.nth) ? '' : ` at nth ${target.nth}`
  } in ${describeWhere(target)} to be ${kind}`;
  if (kind === 'visible') {
    const first = read();
    // Another block that may show the text, or no ClickableHtml to wait for, sends the check to
    // the browser at once. A scope not shown yet is waited for, as a browser waits.
    if (first.scopeShown && first.matches.length <= nth) {
      if (first.other !== null) {
        actor.browserOnly.push(describeOther({ read: first, target }));
        return;
      }
      if (first.htmlBlocks === 0) {
        actor.browserOnly.push(describeNone({ target }));
        return;
      }
    }
    const { value } = await pollUntil({
      check: (reading) => decided(reading) || reading.matches.length > nth,
      read,
      timeout,
    });
    const reason = readBrowserReason(value);
    if (!type.isUndefined(reason)) {
      actor.browserOnly.push(reason);
      return;
    }
    if (value.matches.length > nth) {
      return;
    }
    if (!value.scopeShown) {
      throw new HeadlessStepError(`Expected ${description}.`, {
        actual: 'not visible',
        expected: description,
      });
    }
    actor.browserOnly.push(describeNone({ target }));
    return;
  }
  const { value } = await pollUntil({
    check: (reading) => decided(reading) || reading.matches.length <= nth,
    read,
    timeout,
  });
  const reason = readBrowserReason(value);
  if (!type.isUndefined(reason)) {
    actor.browserOnly.push(reason);
    return;
  }
  if (value.matches.length > nth) {
    throw new HeadlessStepError(
      `Expected ${description}, and ${value.matches.map(describeMatch).join('; ')} ${
        value.matches.length === 1 ? 'shows' : 'show'
      } it.`,
      { actual: 'visible', expected: description }
    );
  }
  if (value.other !== null) {
    actor.browserOnly.push(describeOther({ read: value, target }));
  }
}

export { clickText, expectText, isTextTarget };
