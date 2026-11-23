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

import createElementFinder from '@lowdefy/block-utils/createElementFinder.js';
import { type } from '@lowdefy/helpers';

import HeadlessStepError from '../HeadlessStepError.js';
import pollUntil from '../pollUntil.js';
import readShownBlock from '../readShownBlock.js';
import readStandInState from '../readStandInState.js';
import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import leaveMethodsToBrowser from './leaveMethodsToBrowser.js';
import isHiddenBelow from './isHiddenBelow.js';
import listHtmlControls from './listHtmlControls.js';
import listHtmlTextMatches from './listHtmlTextMatches.js';
import loadHtmlDom from './loadHtmlDom.js';

// What blocks-basic's ClickableHtml does (HtmlComponent), headless, from its rendered html: a
// click on a data-event element its dataEvents lists fires that event with the element's other
// data-* attributes as the event object. A journey names the element as { blockId, control:
// <its data-event>, rowKey: <its data-id> } (markDataEventControls marks it so in the browser). An
// element in popover content is reached too, when no shown element matches: the browser runner
// then opens the first popover holding a match, and the popover closes as the event fires. A
// disabled element refuses the click. An event that asks first (confirm in dataEvents, or
// data-confirm on the element) opens a confirm (state.confirm, its event, and state.open) whose
// buttons are the block's ok and cancel controls: ok fires the event, cancel drops it, and a click
// anywhere else, or new html, closes it, as a click outside (leave) or HtmlComponent does.
//
// A `text` or `containing` target lands on an element too (clickMatch, from textMatches; LDF-1146).
// A click on a data-popover trigger opens its popover (state.popover), whose content a later
// target reaches, as HtmlOverlay shows it: a data-event in it fires and closes it, a click outside
// it, a click on its trigger or Escape closes it, and new html keeps it open on the same trigger
// (HtmlComponent's carryOverlay) while one is there. The block shows one overlay at a time, so a
// confirm the html asks closes the popover; a confirm asked from inside the popover opens over it
// (confirm.inPopover), and its ok closes both.

const CONFIRM_BUTTONS = ['ok', 'cancel'];

function describeControl({ key, rowKey }) {
  return rowKey === null ? key : `${key} (data-id "${rowKey}")`;
}

function describeTarget(target) {
  const parts = [`data-event "${target.control}"`];
  if (!type.isUndefined(target.rowKey)) {
    parts.push(`data-id "${target.rowKey}"`);
  }
  return parts.join(' and ');
}

// A ClickableHtml names its elements by event: a target with no control, or with a grid's column,
// names nothing it draws.
function refuseTarget({ block, target }) {
  if (!type.isUndefined(target.column)) {
    throw new HeadlessStepError(
      `${describeBlock(block)} draws no grid columns: "column" names a cell of a grid.`,
      { actual: block.type, expected: 'a grid block for "column"' }
    );
  }
  if (type.isUndefined(target.control)) {
    throw new HeadlessStepError(
      `${describeBlock(
        block
      )} names its elements by event: add control (the element's data-event) beside rowKey (its data-id).`,
      { actual: 'a rowKey with no control', expected: `a control in ${describeBlock(block)}` }
    );
  }
}

function matchControls({ controls, target }) {
  return controls.filter(
    (control) =>
      control.key === String(target.control) &&
      (type.isUndefined(target.rowKey) || control.rowKey === String(target.rowKey))
  );
}

// The elements a click would choose from, as the browser runner chooses: the shown matches, else,
// when none is shown, the matches in the first popover (in the html's order) that holds one,
// which the runner opens.
function clickMatches({ controls, target }) {
  const matches = matchControls({ controls, target });
  const shown = matches.filter((control) => control.reach === 'shown');
  if (shown.length > 0) {
    return shown;
  }
  const [first] = matches;
  return type.isUndefined(first) ? [] : matches.filter(({ popover }) => popover === first.popover);
}

// The one element the target names, as the browser clicks only a single visible match: none
// fails naming the elements the block has, and several fail with the count. A disabled one
// refuses the click, as a browser cannot click it.
function findOneElement({ block, controls, target }) {
  const matches = clickMatches({ controls, target });
  if (matches.length === 1 && matches[0].disabled) {
    const description = describeBlock(block);
    throw new HeadlessStepError(
      `The element with ${describeTarget(target)} in ${description} is disabled.`,
      { actual: 'disabled', expected: `an enabled element in ${description}` }
    );
  }
  if (matches.length === 1) {
    return matches[0];
  }
  const description = describeBlock(block);
  const named = describeTarget(target);
  if (matches.length === 0) {
    const found = [...new Set(controls.map(describeControl))];
    const confirmNote = CONFIRM_BUTTONS.includes(String(target.control))
      ? ' No confirm of it is open.'
      : '';
    throw new HeadlessStepError(
      `${description} has no element with ${named} that its dataEvents lists.${confirmNote} ${
        found.length === 0 ? 'It has none.' : `It has: ${found.join(', ')}.`
      }`,
      { actual: `no element with ${named}`, expected: `an element with ${named} in ${description}` }
    );
  }
  throw new HeadlessStepError(
    `${description} has ${matches.length} elements with ${named}; give each its own data-id and name it with rowKey.`,
    { actual: `${matches.length} elements`, expected: `exactly one element with ${named}` }
  );
}

function readHtml(block) {
  const { html } = block.eval.properties ?? {};
  return type.isNone(html) ? '' : String(html);
}

// state.open: a confirm or a popover is open, for leaveDropdowns and pressEscape.
function syncOpen(state) {
  state.open = !type.isUndefined(state.confirm) || !type.isUndefined(state.popover);
}

function closeConfirm(state) {
  state.confirm = undefined;
  state.confirmHtml = undefined;
  syncOpen(state);
}

function closePopover(state) {
  state.popover = undefined;
  syncOpen(state);
}

// The popover content `trigger` opens in the html `root`: the data-popover-content element with
// its id, as popoverEnhancer captures it, or null.
function findPopoverContent({ root, trigger }) {
  const id = trigger.getAttribute('data-popover');
  return (
    [...root.querySelectorAll('[data-popover-content]')].find(
      (content) => content.getAttribute('data-popover-content') === id
    ) ?? null
  );
}

// Opens the popover `trigger` (in the parsed html `root`) opens. A trigger with no content opens
// nothing, as popoverEnhancer warns and opens none.
function openPopover({ block, parse, root, state, trigger }) {
  const content = findPopoverContent({ root, trigger });
  if (content === null) {
    return;
  }
  state.popover = {
    blockHtml: readHtml(block),
    find: createElementFinder({ element: trigger, root }),
    html: content.innerHTML,
    id: trigger.getAttribute('data-popover'),
  };
  state.parse = parse;
  syncOpen(state);
}

// A confirm is never carried to new html (confirmEnhancer has no retarget): it closes when the
// block's html changes, as HtmlComponent's carryOverlay closes it.
function readConfirm({ block, state }) {
  if (!type.isUndefined(state.confirm) && state.confirmHtml !== readHtml(block)) {
    closeConfirm(state);
  }
  return state.confirm;
}

// The open popover. New html keeps it open on the element that says the same at the same place
// (createElementFinder), its content read again, and closes it when there is none.
function readPopover({ block, state }) {
  const { popover } = state;
  if (type.isUndefined(popover) || popover.blockHtml === readHtml(block)) {
    return popover;
  }
  closePopover(state);
  const root = state.parse(readHtml(block));
  const trigger = popover.find(root);
  if (trigger !== null && trigger.hasAttribute('data-popover')) {
    openPopover({ block, parse: state.parse, root, state, trigger });
  }
  return state.popover;
}

// A click on ok or cancel while the confirm is open answers it.
function answersConfirm({ block, state, target }) {
  return (
    !type.isUndefined(readConfirm({ block, state })) &&
    type.isUndefined(target.rowKey) &&
    CONFIRM_BUTTONS.includes(String(target.control))
  );
}

// The trigger of the popover whose content holds a control the html reaches in a popover
// (listHtmlControls' reach), as findReach finds it shown.
function findPopoverTrigger({ content, root }) {
  const id = content.getAttribute('data-popover-content');
  return (
    [...root.querySelectorAll('[data-popover]')].find(
      (trigger) =>
        trigger.getAttribute('data-popover') === id &&
        trigger.closest('[data-popover-content]') === null &&
        !isHiddenBelow({ element: trigger, stop: root })
    ) ?? null
  );
}

function askConfirm({ block, dataEvent, inPopover, message, state }) {
  state.confirm = { ...dataEvent, inPopover, message };
  state.confirmHtml = readHtml(block);
  syncOpen(state);
}

// Answers the open confirm with its ok or cancel: ok fires the event it asked for, and a confirm
// asked from inside the popover closes the popover too, as onPopoverDataEvent does.
function answerConfirm({ actor, block, control, state }) {
  const { confirm } = state;
  closeConfirm(state);
  if (control !== 'ok') {
    return;
  }
  if (confirm.inPopover) {
    closePopover(state);
  }
  fireEvent({ actor, block, name: confirm.name, event: confirm.event });
}

async function click({ actor, block, state, target }) {
  refuseTarget({ block, target });
  if (answersConfirm({ block, state, target })) {
    answerConfirm({ actor, block, control: String(target.control), state });
    return;
  }
  // A click on another element is a click outside the open confirm.
  closeConfirm(state);
  const parse = await loadHtmlDom();
  const root = parse(readHtml(block));
  const control = findOneElement({
    block,
    controls: listHtmlControls({ block, parse }),
    target,
  });
  // A shown element is outside the open popover. One in a popover is clicked in that popover,
  // which the browser runner opens when it is closed.
  closePopover(state);
  const inPopover = control.reach === 'popover';
  if (inPopover) {
    const trigger = findPopoverTrigger({ content: control.popover, root });
    if (trigger !== null) {
      openPopover({ block, parse, root, state, trigger });
    }
  }
  if (control.confirm) {
    askConfirm({
      block,
      dataEvent: control.dataEvent,
      inPopover: inPopover && !type.isUndefined(state.popover),
      message: null,
      state,
    });
    return;
  }
  closePopover(state);
  fireEvent({ actor, block, name: control.dataEvent.name, event: control.dataEvent.event });
}

// Whether a press on the matched element lands inside the open popover or on its trigger, which
// HtmlOverlay never counts as a click outside.
function isOnPopover({ match, state }) {
  if (match.where === 'popover') {
    return true;
  }
  const trigger = state.popover.find(match.root);
  return trigger !== null && trigger.contains(match.element);
}

// Whether the matched element is the one whose open confirm a second click keeps open
// (confirmEnhancer).
function isConfirmTarget({ match, state }) {
  return (
    match.action.kind === 'event' &&
    match.action.confirm &&
    match.action.dataEvent.name === state.confirm.name &&
    JSON.stringify(match.action.dataEvent.event) === JSON.stringify(state.confirm.event) &&
    (match.where === 'popover') === state.confirm.inPopover
  );
}

// A click on an element a `text` or `containing` target matched (textMatches), as a browser
// clicks it: the press first closes the overlay on top (the confirm, else the popover) unless it
// lands in it or on what opened it (HtmlOverlay's mousedown), then HtmlComponent answers the
// click (listHtmlTextMatches' readAction). A data-event element fires its event, or asks first;
// a popover trigger opens its popover, or closes it when it is open.
async function clickMatch({ actor, block, match, state }) {
  readConfirm({ block, state });
  readPopover({ block, state });
  if (match.where === 'confirm') {
    if (match.action.kind === 'confirm') {
      actor.landedControl = { blockId: block.blockId, control: match.action.control, rowKey: null };
      answerConfirm({ actor, block, control: match.action.control, state });
    }
    return;
  }
  if (!type.isUndefined(state.confirm)) {
    if (isConfirmTarget({ match, state })) {
      return;
    }
    closeConfirm(state);
  } else if (!type.isUndefined(state.popover) && !isOnPopover({ match, state })) {
    closePopover(state);
  }
  const { action } = match;
  if (action.kind === 'event') {
    actor.landedControl = { blockId: block.blockId, ...action.control };
    if (action.confirm) {
      if (match.where === 'html') {
        closePopover(state);
      }
      askConfirm({
        block,
        dataEvent: action.dataEvent,
        inPopover: match.where === 'popover',
        message: action.message,
        state,
      });
      return;
    }
    if (match.where === 'popover') {
      closePopover(state);
    }
    fireEvent({ actor, block, name: action.dataEvent.name, event: action.dataEvent.event });
    return;
  }
  if (action.kind === 'popover') {
    const wasOpen =
      !type.isUndefined(state.popover) && state.popover.find(match.root) === action.trigger;
    closePopover(state);
    if (!wasOpen) {
      openPopover({
        block,
        parse: await loadHtmlDom(),
        root: match.root,
        state,
        trigger: action.trigger,
      });
    }
  }
}

// What a `text` or `containing` target matches in the block (listHtmlTextMatches), with its open
// popover and confirm when `overlays` (a target with no blockId searches the page, where antd
// draws them). parse is loadHtmlDom's; i18n the app's.
function textMatches({ block, i18n, overlays, parse, state, target }) {
  return listHtmlTextMatches({
    block,
    confirm: readConfirm({ block, state }) ?? null,
    html: readHtml(block),
    i18n,
    overlays,
    parse,
    popover: readPopover({ block, state })?.html ?? null,
    target,
  });
}

// Another block's click, open or select closes the confirm and the popover, as a click outside
// them does.
function leave({ state }) {
  closeConfirm(state);
  closePopover(state);
}

// Escape closes the newest of the open confirm and popover, and a confirm drops its event, as
// HtmlOverlay does.
function escape({ block, state }) {
  if (!type.isUndefined(readConfirm({ block, state }))) {
    closeConfirm(state);
    return;
  }
  closePopover(state);
}

// Whether the confirm or the popover is open: new html has closed the confirm (readConfirm), or
// the popover when its trigger is gone (readPopover).
function isOpen({ block, state }) {
  readConfirm({ block, state });
  readPopover({ block, state });
  return state.open === true;
}

// expect.visible or expect.hidden on an element by event and data-id, read from the html the page
// shows and the open popover's content, or on the open confirm's ok or cancel. The step runner does
// not wait for the block, so the check reads whether it shows, as the browser waits up to
// `timeout` ms.
async function expect({ actor, block, kind, target, timeout }) {
  refuseTarget({ block, target });
  const parse = await loadHtmlDom();
  const shown = kind === 'visible';
  const read = () => {
    const current = readShownBlock({ actor, blockId: target.blockId });
    if (current === null) {
      return 0;
    }
    const state = readStandInState({ actor, block: current });
    if (answersConfirm({ block: current, state, target })) {
      return 1;
    }
    const popover = readPopover({ block: current, state });
    const controls = listHtmlControls({ block: current, parse }).filter(
      (control) =>
        control.reach === 'shown' ||
        (control.reach === 'popover' &&
          control.popover.getAttribute('data-popover-content') === popover?.id)
    );
    return matchControls({ controls, target }).length;
  };
  const { held, value: count } = await pollUntil({
    check: (read) => (shown ? read > 0 : read === 0),
    read,
    timeout,
  });
  const description = `${describeBlock(block)} element with ${describeTarget(
    target
  )} to be ${kind}`;
  if (!held) {
    throw new HeadlessStepError(`Expected ${description}.`, {
      actual: shown ? 'not visible' : 'visible',
      expected: description,
    });
  }
  if (count > 1) {
    throw new HeadlessStepError(
      `Expected ${description}, and matched ${count} elements; give each its own data-id and name it with rowKey.`,
      {
        actual: `${count} elements`,
        expected: `exactly one element with ${describeTarget(target)}`,
      }
    );
  }
}

// ClickableHtml registers no methods: a CallMethod on it is the browser's.
function registerMethods({ actor, block }) {
  leaveMethodsToBrowser({ actor, block });
}

export default { click, clickMatch, escape, expect, isOpen, leave, registerMethods, textMatches };
