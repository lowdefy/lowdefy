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

import { getStepKey } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import BLOCK_STAND_INS from './BLOCK_STAND_INS.js';
import blurInputs from './blurInputs.js';
import checkHeadlessPressRails from './checkHeadlessPressRails.js';
import checkHeadlessRails from './checkHeadlessRails.js';
import checkFillTarget from './checkFillTarget.js';
import fillColorSelector from './fillColorSelector.js';
import findContentTrigger from './findContentTrigger.js';
import findTextWritingLabel from './findTextWritingLabel.js';
import INLINE_OPTION_TYPES from './INLINE_OPTION_TYPES.js';
import leaveDropdowns from './leaveDropdowns.js';
import pointerClick from './pointerClick.js';
import pressEscape from './pressEscape.js';
import readStandInState from './readStandInState.js';
import runHeadlessCall from './runHeadlessCall.js';
import runHeadlessExpect from './runHeadlessExpect.js';
import runHeadlessWebhook from './runHeadlessWebhook.js';
import standInMissing from './standInMissing.js';
import waitForNextTask from './waitForNextTask.js';
import waitForRequestCall from './waitForRequestCall.js';
import waitForShownBlock from './waitForShownBlock.js';

const STEP_RUNNER_KEYS = ['click', 'fill', 'select', 'press', 'wait'];

function readGoto(goto) {
  return type.isString(goto) ? { pageId: goto } : goto;
}

// A target only a block's stand-in resolves: a grid row by key, or a control the block draws.
function isStandInTarget(target) {
  return (
    type.isObject(target) && (Object.hasOwn(target, 'rowKey') || Object.hasOwn(target, 'control'))
  );
}

const INPUT_FOCUS_KEYS = ['fill', 'select'];
const POINTER_KEYS = ['click', 'open'];

// Whether an open step only hovers its block, as the browser runner's openDropdown does for a
// dropdown that opens on hover (a DropdownMenu unless its trigger says otherwise): the pointer
// moves and the focus stays where it was.
function opensOnHover({ actor, target }) {
  if (!type.isString(target) && !type.isUndefined(target.rowKey ?? target.row ?? target.column)) {
    return false;
  }
  const block = actor.page.context._internal.RootSlots.map[target.blockId ?? target];
  if (type.isNone(block)) {
    return false;
  }
  const trigger =
    block.eval.properties?.trigger ?? (block.type === 'DropdownMenu' ? 'hover' : 'click');
  return trigger === 'hover';
}

// Where the focus and the pointer are, for a press of Escape (pressEscape): a fill or select puts
// the focus in the input it acts on; a click or open moves the pointer to its block
// (page.pointerBlockId), and moves the focus off every input unless it only hovers. A goto, back
// or `as` shows another page, whose focus starts on no input.
function noteFocus({ actor, key, step }) {
  if (INPUT_FOCUS_KEYS.includes(key)) {
    actor.page.inputFocused = true;
  }
  if (!POINTER_KEYS.includes(key)) {
    return;
  }
  const target = step[key];
  actor.page.pointerBlockId = type.isString(target) ? target : target.blockId;
  if (key === 'click' || !opensOnHover({ actor, target })) {
    actor.page.inputFocused = false;
  }
}

// Runs a part of the block's stand-in (BLOCK_STAND_INS) with what it keeps for the block, after
// the other open dropdowns hear the pointer leave them, then lets the page settle. A block whose
// type has no such part leaves the step to the browser, naming the block and its type.
async function runStandIn({ actor, block, part, what, ...args }) {
  const standIn = BLOCK_STAND_INS[block.type];
  if (!type.isFunction(standIn?.[part])) {
    actor.browserOnly.push(standInMissing({ block, what }));
    return;
  }
  await leaveDropdowns({ actor, except: block, targetBlock: block });
  await standIn[part]({ actor, block, state: readStandInState({ actor, block }), ...args });
  await actor.settle();
}

// The blocks a plain click fires events on, checked against the rails as the browser runner checks
// them (checkStepRails): the block the click lands on (a dropdown's content control, when the
// dropdown's stand-in says where its click lands: clickLandsOn), then the dropdown whose content
// holds it (findContentTrigger), whose trigger hears the click and opens.
function railClick({ actor, landed, rails }) {
  [landed, findContentTrigger({ actor, block: landed })]
    .filter((block) => block !== null)
    .forEach((block) =>
      checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'click' })
    );
}

// A click on a block: a rowKey or control target, and a plain click a component answers itself
// (a dropdown's trigger), go to the block's stand-in. Any other click fires the block's onClick
// through the step runner, as a pointer click (pointerClick: a block in a DropdownMenu's content
// clicks its trigger too); a block with none is left to the browser, where the click lands on a
// control inside it. On a data-set journey the click is checked against the rails before it acts,
// a dropdown's stand-in opening it included (railClick); a rowKey or control target's block is the
// target's own. Resolves true when the click is done.
async function runBlockClick({ actor, rails, step, stepTimeout }) {
  const target = step.click;
  const block = await waitForShownBlock({ actor, target, timeout: stepTimeout });
  if (isStandInTarget(target)) {
    checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'click' });
    await runStandIn({
      actor,
      block,
      part: 'click',
      target,
      what: `a click on a ${Object.hasOwn(target, 'control') ? 'control' : 'rowKey'} target`,
    });
    return true;
  }
  if (BLOCK_STAND_INS[block.type]?.answersBlockClick?.({ block }) === true) {
    const landed = BLOCK_STAND_INS[block.type].clickLandsOn?.({ actor, block }) ?? block;
    railClick({ actor, landed, rails });
    await runStandIn({ actor, block, part: 'clickBlock', what: 'a click on the block' });
    return true;
  }
  if (!Object.hasOwn(block.Events.events, 'onClick')) {
    actor.browserOnly.push(
      `Block "${block.blockId}" has no onClick: in a browser a click on it lands on a control inside it.`
    );
    return true;
  }
  railClick({ actor, landed: block, rails });
  await pointerClick({ actor, block, click: () => actor.stepRunner.run({ step }) });
  await actor.settle();
  return true;
}

// expect.visible or expect.hidden on a grid row by key, or on a control a block draws (a
// ClickableHtml element), goes to the block's stand-in. A block that is not on the page has no
// rows or controls: the check reads it as runHeadlessExpect does. Resolves true when the check is
// done.
async function runStandInExpect({ actor, step, stepTimeout }) {
  const kind = getStepKey(step.expect);
  const target = step.expect[kind];
  if (!['visible', 'hidden'].includes(kind) || !isStandInTarget(target)) {
    return false;
  }
  const block = actor.page?.context._internal.RootSlots.map[target.blockId];
  if (type.isNone(block)) {
    return false;
  }
  const standIn = BLOCK_STAND_INS[block.type];
  if (!type.isFunction(standIn?.expect)) {
    actor.browserOnly.push(
      standInMissing({
        block,
        what: `expect.${kind} on a ${Object.hasOwn(target, 'control') ? 'control' : 'rowKey'}`,
      })
    );
    return true;
  }
  await standIn.expect({
    actor,
    block,
    kind,
    state: readStandInState({ actor, block }),
    target,
    timeout: stepTimeout,
  });
  return true;
}

// Runs one journey step headless on the current actor (actors.current()): block steps through
// client-core's step runner, then the page settles, a navigation it started included; goto is a
// full page load, back goes back one page, as switches person (opening the journey's first page
// for one met for the first time); call and request go to the server directly, as the step's
// `as` or the current actor, and a webhook as its sender posts it, and resolve the answer the
// expect steps after them read; expect
// checks the engine, the answer or the data (runHeadlessExpect). Resolves the answer of a call,
// request or webhook, and undefined for any other step.
//
// Before a block step acts, its block must be shown, as the browser waits for a visible target. A
// click on a rowKey or control target, an open, a plain click a component answers itself (a
// dropdown's trigger) and expect.visible or hidden on a rowKey or control go to the block's
// stand-in (BLOCK_STAND_INS); a block with no stand-in for the step marks the journey browser-only
// (actor.browserOnly), naming the block and its type, as a click on a block with no onClick of its
// own does, which in a browser lands on a control inside it. A click, open or select first closes
// any other open dropdown (leaveDropdowns), and a fill the browser would not refuse blurs the input
// that had the focus (blurInputs). A fill or select on a block whose stand-in has a part for it
// goes to the stand-in (a searching selector's fill types into its search box); an Enter after such
// a fill, which the stand-in has no press for, needs the browser. Any other fill is refused where
// the browser's would be (checkFillTarget); a ColorSelector's fill clicks its picker first, as the
// browser's does (fillColorSelector). wait.request waits for a call made since the last
// interaction: `since` is the actor's call count when that window opened. A press of Escape
// closes the overlay that opened last, or the open dropdown of the searching selector that has the
// focus (pressEscape), which needs to know where the focus is (noteFocus).
//
// On a data-set journey (rails: the run's createDataSetRails, else null), a click, open, fill,
// select or press is checked against the rails on the block it acts on before it acts, as the
// browser runner checks it (checkHeadlessRails): a press on the input it presses Enter in, the
// one filled last, the blocks around it and the blocks whose shortcut Enter fires
// (checkHeadlessPressRails).
async function runHeadlessStep({ actors, answer, host, rails, since, step, stepTimeout }) {
  const key = getStepKey(step);
  const actor = actors.current();
  noteFocus({ actor, key, step });
  if (key === 'press' && step.press === 'Escape') {
    await pressEscape({ actor, rails });
    return undefined;
  }
  if (key === 'click' && (await runBlockClick({ actor, rails, step, stepTimeout }))) {
    return undefined;
  }
  if (key === 'open') {
    const block = await waitForShownBlock({ actor, target: step.open, timeout: stepTimeout });
    checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'open' });
    await runStandIn({ actor, block, part: 'open', what: 'open' });
    return undefined;
  }
  if (key === 'fill') {
    const block = await waitForShownBlock({ actor, target: step.fill, timeout: stepTimeout });
    checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'fill' });
    const standIn = BLOCK_STAND_INS[block.type];
    if (type.isFunction(standIn?.fill)) {
      standIn.checkFill({ block });
      await blurInputs({ actor, except: block });
      await standIn.fill({
        actor,
        block,
        state: readStandInState({ actor, block }),
        value: step.fill.value,
      });
      await actor.settle();
      return undefined;
    }
    checkFillTarget({ block, value: step.fill.value });
    await blurInputs({ actor, except: block });
    if (block.type === 'ColorSelector') {
      await fillColorSelector({ actor, block, step });
      return undefined;
    }
  }
  if (key === 'select') {
    const block = await waitForShownBlock({ actor, target: step.select, timeout: stepTimeout });
    checkHeadlessRails({ actor, blockId: block.blockId, rails, step: 'select' });
    const textWritten = await findTextWritingLabel({ actor, block });
    if (textWritten !== null) {
      actor.browserOnly.push(textWritten);
      return undefined;
    }
    await leaveDropdowns({ actor, except: block, targetBlock: block });
    // A browser's select on a dropdown clicks the block open before it picks the option, so a
    // selector that click closed clears its search (a task later) before the pick's onChange. An
    // inline option is one click, whose onChange starts first, as after any other click.
    if (!INLINE_OPTION_TYPES.has(block.type)) {
      await waitForNextTask();
    }
    const standIn = BLOCK_STAND_INS[block.type];
    if (type.isFunction(standIn?.select)) {
      await standIn.select({ actor, block, state: readStandInState({ actor, block }), step });
      await actor.settle();
      return undefined;
    }
  }
  // Any other press is Enter in the input the step runner filled last (classifyJourney leaves
  // every key but Enter and Escape to the browser). It is checked as the browser checks a press
  // (checkHeadlessPressRails). With no input filled, or one no longer on the page, the step runner
  // refuses the press itself, saying why.
  if (key === 'press') {
    const focused = actor.page.context._internal.RootSlots.map[actor.stepRunner.lastInputBlockId()];
    if (!type.isNone(focused)) {
      checkHeadlessPressRails({ actor, focused, key: step.press, rails });
      const standIn = BLOCK_STAND_INS[focused.type];
      if (type.isFunction(standIn?.fill) && !type.isFunction(standIn.press)) {
        actor.browserOnly.push(standInMissing({ block: focused, what: 'press "Enter"' }));
        return undefined;
      }
    }
  }
  if (key === 'wait' && type.isString(step.wait.request)) {
    await waitForRequestCall({
      actor,
      requestId: step.wait.request,
      since: since.get(actor) ?? 0,
      timeout: stepTimeout,
    });
    return undefined;
  }
  if (STEP_RUNNER_KEYS.includes(key)) {
    await actor.stepRunner.run({ step });
    await actor.settle();
    return;
  }
  switch (key) {
    case 'goto':
      await actor.load(readGoto(step.goto));
      await actor.settle();
      return;
    case 'back':
      await actor.back();
      await actor.settle();
      return;
    case 'as':
      await actors.switchTo(step.as);
      await actors.current().settle();
      return;
    case 'expect':
      if (await runStandInExpect({ actor, step, stepTimeout })) {
        return;
      }
      await runHeadlessExpect({ actor, answer, host, step, timeout: stepTimeout });
      return;
    case 'call':
    case 'request':
      return runHeadlessCall({ actors, host, step });
    case 'webhook':
      return runHeadlessWebhook({ actors, host, step });
    default:
      // The grammar admits nothing else; a step it gains is not passed unchecked.
      throw new Error(`The headless journey runner has no step "${key}".`);
  }
}

export default runHeadlessStep;
