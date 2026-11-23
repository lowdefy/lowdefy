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

// What blocks-antd's searching selectors do (Selector, MultipleSelector, TreeSelector and
// TreeMultipleSelector, on rc-select's BaseSelect) when a journey types into them. The browser
// runner's fill types into the block's first input, which is the select's search box: the block
// fires onSearch { value } and its value stays as it was. Typing opens the dropdown, which the
// stand-in keeps as state.open with the search text as state.searchValue. Only onSearch is
// modelled: onFocus and onOpenChange fire in a browser and not headless, as on any other select.
// - A select on the block picks the option (client-core's step runner) and clears the search
//   without an onSearch, as rc-select does; a single select closes its dropdown, a multiple one
//   stays open, and keeps its search when autoClearSearchValue is false.
// - A click, open or select elsewhere (leave), or a fill of another input (blur), closes the
//   dropdown and clears the search, as the focus leaves the block: a single select fires
//   onSearch { value: '' } as its dropdown closes, and so does a TreeMultipleSelector as it
//   loses the focus; a MultipleSelector clears it with no event.
// - A press after the fill is Enter in the search box, which picks the option the dropdown
//   highlights: the stand-in has no press, so the step runs in a browser (runHeadlessStep).
// With showSearch false the search box is read-only, so the browser's fill fails, and this one
// fails with it.

const SEARCH_SELECTORS = {
  MultipleSelector: { multiple: true, searchOnLeave: false },
  Selector: { multiple: false, searchOnLeave: true },
  TreeMultipleSelector: { multiple: true, searchOnLeave: true },
  TreeSelector: { multiple: false, searchOnLeave: true },
};

function refuseFill({ block }) {
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

// The fill's own checks: the block's rails are checked before (runHeadlessStep). Playwright's fill
// replaces the search text, and an input event fires only when it changed; the dropdown opens on
// text, not on clearing it.
function fill({ actor, block, state, value }) {
  refuseFill({ block });
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

async function select({ actor, block, state, step }) {
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

// The focus leaving the block closes its dropdown, by a click elsewhere (leave) or a fill of
// another input (blur). The browser closes it on the mousedown or blur, before the click or
// typing that follows, so the onSearch it fires runs first: this resolves once that onSearch has
// finished, or at once when a debounce delays it (isSearchDelayed).
function close({ actor, block, state }) {
  state.open = false;
  const searched = (state.searchValue ?? '') !== '';
  state.searchValue = '';
  if (!searched || !SEARCH_SELECTORS[block.type].searchOnLeave) {
    return Promise.resolve();
  }
  const searching = search({ actor, block, value: '' });
  return isSearchDelayed(block) ? Promise.resolve() : afterEvent(searching);
}

export default { blur: close, fill, leave: close, select };
