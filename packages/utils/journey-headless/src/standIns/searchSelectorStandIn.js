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
import fireEvent, { afterEvent } from './fireEvent.js';
import leaveMethodsToBrowser from './leaveMethodsToBrowser.js';

// What blocks-antd's searching selectors do (Selector, MultipleSelector, TreeSelector and
// TreeMultipleSelector, on rc-select's BaseSelect) when a journey types into them. The browser
// runner's fill types into the block's first input, which is the select's search box: the block
// fires onSearch { value } and its value stays as it was. Typing opens the dropdown, which the
// stand-in keeps as state.open with the search text as state.searchValue. Only onSearch is
// modelled: onFocus, onBlur and onOpenChange fire in a browser and not headless, as on any other
// select.
// - A select on the block picks the option (client-core's step runner), refused when the search
//   hides it in the dropdown (refuseHiddenOption), and clears the search
//   without an onSearch, as rc-select does; a single select closes its dropdown, a multiple one
//   stays open, and keeps its search when autoClearSearchValue is false.
// - A click, open or select elsewhere (leave), or a fill of another input (blur), closes the
//   dropdown and clears the search, as the focus leaves the block: a single select fires
//   onSearch { value: '' } as its dropdown closes, after the next step's events start, and a
//   TreeMultipleSelector as it loses the focus, before them; a MultipleSelector clears it with
//   no event.
// - A press after the fill is Enter in the search box, which picks the option the dropdown
//   highlights: the stand-in has no press, so the step runs in a browser (runHeadlessStep).
// With showSearch false the search box is read-only, so the browser's fill fails, and this one
// fails with it.

// multiple: the block keeps its dropdown open after a pick. searchOnLeave: the focus leaving it
// fires onSearch { value: '' } when it holds a search. filtersOptions: its dropdown shows only the
// options whose filterString (else label) holds the search, case ignored (blocks-antd's
// filterSelectorOption); a tree selector's filter also keeps a matching node's parents, which is
// not modelled, so its select is not filtered.
const SEARCH_SELECTORS = {
  MultipleSelector: { filtersOptions: true, multiple: true, searchOnLeave: false },
  Selector: { filtersOptions: true, multiple: false, searchOnLeave: true },
  TreeMultipleSelector: { filtersOptions: false, multiple: true, searchOnLeave: true },
  TreeSelector: { filtersOptions: false, multiple: false, searchOnLeave: true },
};

// What the browser's fill refuses, checked before the focus moves (runHeadlessStep).
function checkFill({ block }) {
  const description = `block "${block.blockId}" (${block.type})`;
  if (block.eval.properties?.disabled === true) {
    throw new HeadlessStepError(`The input in ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled input in ${description}`,
    });
  }
  if (block.eval.properties?.showSearch === false) {
    throw new HeadlessStepError(
      `The search box in ${description} is read-only (showSearch is false), so fill cannot type into it: select picks its option.`,
      { actual: 'read-only', expected: `an editable search box in ${description}` }
    );
  }
}

function search({ actor, block, value }) {
  return fireEvent({ actor, block, name: 'onSearch', event: { value } });
}

// The fill's checks (checkFill) and the block's rails run before (runHeadlessStep). Playwright's
// fill replaces the search text, and an input event fires only when it changed; the dropdown opens
// on text, not on clearing it.
function fill({ actor, block, state, value }) {
  const text = String(value);
  actor.stepRunner.setLastInputBlockId(block.blockId);
  if (text === (state.searchValue ?? '')) {
    return;
  }
  state.searchValue = text;
  if (text !== '') {
    state.open = true;
  }
  search({ actor, block, value: text });
}

function readOptionText(option) {
  return type.isObject(option) ? String(option.label ?? option.value) : String(option);
}

function readFilterString(option) {
  if (type.isObject(option) && type.isString(option.filterString) && option.filterString !== '') {
    return option.filterString;
  }
  return readOptionText(option);
}

// A select after a search picks from the options the search leaves in the dropdown: an option it
// hides does not appear, and the browser's select fails. The option is the one the step runner
// picks, by the text its label shows (readOptionTexts); the filter reads the label's html, as
// filterSelectorOption does. An option that is not there at all is left to the step runner,
// which names the options there are.
async function refuseHiddenOption({ actor, block, state, value }) {
  const search = state.searchValue ?? '';
  if (search === '' || !SEARCH_SELECTORS[block.type].filtersOptions) {
    return;
  }
  const texts = await actor.stepRunner.readOptionTexts({ block });
  const option = (block.eval.properties?.options ?? [])[texts.indexOf(String(value))];
  if (
    option === undefined ||
    readFilterString(option).toLowerCase().includes(search.toLowerCase())
  ) {
    return;
  }
  const description = `block "${block.blockId}"`;
  throw new HeadlessStepError(
    `No option with text "${value}" appeared in the dropdown of ${description}: the search "${search}" hides it.`,
    {
      actual: `option "${value}" hidden by the search "${search}"`,
      expected: `option "${value}" in the dropdown of ${description}`,
    }
  );
}

async function select({ actor, block, state, step }) {
  await refuseHiddenOption({ actor, block, state, value: step.select.value });
  await actor.stepRunner.run({ step });
  const { multiple } = SEARCH_SELECTORS[block.type];
  if (!multiple || block.eval.properties?.autoClearSearchValue !== false) {
    state.searchValue = '';
  }
  // A select that opens the dropdown leaves a multiple one open, as a pick does.
  state.open = multiple;
}

// Whether a trailing-edge debounce holds the block's onSearch, so its actions run after the step
// that follows has started, in a browser as here.
function isSearchDelayed(block) {
  const debounce = block.Events.events.onSearch?.debounce;
  return !type.isNone(debounce) && debounce.immediate !== true;
}

// The next task, after the step that follows has started its events.
function afterNextTask(fn) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(fn()), 0);
  });
}

// The focus leaving the block closes its dropdown, by a click elsewhere (leave) or a fill of
// another input (blur), and clears its search:
// - A multiple select clears it on the blur, as the mousedown or the next input takes the focus,
//   so a TreeMultipleSelector's onSearch { value: '' } runs before the click or typing that
//   follows. This resolves once that onSearch has finished, or at once when a debounce delays it
//   (isSearchDelayed); one that makes a request is waited for whole, where in a browser the next
//   step's events start while the request is in flight.
// - A single select clears it as its dropdown closes, which rc-select's useOpen puts off to a
//   later task: the next step's events start first, then onSearch { value: '' } fires. The actor
//   holds it until the step settles.
function close({ actor, block, state }) {
  state.open = false;
  const searched = (state.searchValue ?? '') !== '';
  state.searchValue = '';
  const { multiple, searchOnLeave } = SEARCH_SELECTORS[block.type];
  if (!searched || !searchOnLeave) {
    return Promise.resolve();
  }
  if (!multiple) {
    // afterEvent: fireEvent tracks the event itself, which reports its error once.
    actor.track(afterNextTask(() => afterEvent(search({ actor, block, value: '' }))));
    return Promise.resolve();
  }
  const searching = search({ actor, block, value: '' });
  return isSearchDelayed(block) ? Promise.resolve() : afterEvent(searching);
}

// The blocks register methods in the browser (setData, from blocks-antd's useSetData), which no
// stand-in models, so a CallMethod on one marks the journey browser-only, as on a block with no
// stand-in.
function registerMethods({ actor, block }) {
  leaveMethodsToBrowser({ actor, block });
}

export default { blur: close, checkFill, fill, leave: close, registerMethods, select };
