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

import HeadlessStepError from '../HeadlessStepError.js';
import pollUntil from '../pollUntil.js';
import readShownBlock from '../readShownBlock.js';
import readStandInState from '../readStandInState.js';
import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import leaveMethodsToBrowser from './leaveMethodsToBrowser.js';
import listHtmlControls from './listHtmlControls.js';
import loadHtmlDom from './loadHtmlDom.js';

// What blocks-basic's ClickableHtml does (HtmlComponent), headless, from its rendered html: a
// click on a data-event element its dataEvents lists fires that event with the element's other
// data-* attributes as the event object. A journey names the element as { blockId, control:
// <its data-event>, rowKey: <its data-id> } (markDataEventControls marks it so in the browser). An
// element in popover content is reached too: the browser runner opens its popover first, and the
// popover closes as the event fires. An event that asks first (confirm in dataEvents, or
// data-confirm on the element) opens a confirm (state.confirm, its event, and state.open) whose
// buttons are the block's ok and cancel controls: ok fires the event, cancel drops it, and a click
// anywhere else closes it, as a click outside does (leave).

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
      `${describeBlock(block)} names its elements by event: add control (the element's data-event) beside rowKey (its data-id).`,
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

// The one element the target names, as the browser clicks only a single visible match: none
// fails naming the elements the block has, and several fail with the count.
function findOneElement({ block, controls, target }) {
  const matches = matchControls({ controls, target });
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

function closeConfirm(state) {
  state.confirm = undefined;
  state.open = false;
}

// A click on ok or cancel while the confirm is open answers it.
function answersConfirm({ state, target }) {
  return (
    !type.isUndefined(state.confirm) &&
    type.isUndefined(target.rowKey) &&
    CONFIRM_BUTTONS.includes(String(target.control))
  );
}

async function click({ actor, block, state, target }) {
  refuseTarget({ block, target });
  if (answersConfirm({ state, target })) {
    const { confirm } = state;
    closeConfirm(state);
    if (String(target.control) === 'ok') {
      fireEvent({ actor, block, name: confirm.name, event: confirm.event });
    }
    return;
  }
  // A click on another element is a click outside the open confirm.
  closeConfirm(state);
  const parse = await loadHtmlDom();
  const control = findOneElement({
    block,
    controls: listHtmlControls({ block, parse, reach: 'click' }),
    target,
  });
  if (control.confirm) {
    state.confirm = control.dataEvent;
    state.open = true;
    return;
  }
  fireEvent({ actor, block, name: control.dataEvent.name, event: control.dataEvent.event });
}

// Another block's click, open or select closes the confirm, as a click outside it does.
function leave({ state }) {
  closeConfirm(state);
}

// expect.visible or expect.hidden on an element by event and data-id, read from the html the page
// shows (popover content is closed), or on the open confirm's ok or cancel. The step runner does
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
    if (answersConfirm({ state: readStandInState({ actor, block: current }), target })) {
      return 1;
    }
    const controls = listHtmlControls({ block: current, parse, reach: 'shown' });
    return matchControls({ controls, target }).length;
  };
  const { held, value: count } = await pollUntil({
    check: (read) => (shown ? read > 0 : read === 0),
    read,
    timeout,
  });
  const description = `${describeBlock(block)} element with ${describeTarget(target)} to be ${kind}`;
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

export default { click, expect, leave, registerMethods };
