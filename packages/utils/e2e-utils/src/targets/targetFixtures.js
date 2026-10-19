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

// One table of DOM snippets, as Lowdefy blocks render them, with the journey target each one's
// element describes as. The engine's describeElement and the PostHog chain parser are both tested
// against it, so the two cannot drift from the journey runner's resolution.
//
// Each fixture:
// - html: the snippet, set as document.body.innerHTML.
// - element: a selector for the element the target names (what a click step acts on).
// - clicked: a selector for where a person's click lands, when that is inside the element (a
//   label's text, a button's span). posthog-js records the clicked element.
// - target: the canonical target the element describes as, in describe form.
// - blockIds: the enclosing block ids, innermost first.
// - resolvable: whether the target resolves back to the element as a click. A dropdown option
//   does not: it folds into a select step.
// - variants: other runner targets that resolve to the same element.

function target(fields) {
  return {
    block_id: null,
    row: null,
    column: null,
    text: null,
    nth: null,
    option: false,
    ...fields,
  };
}

const grid = `
<div id="bl-tasks" class="ag-theme-quartz">
  <div class="ag-center-cols-container">
    <div class="ag-row" row-index="0">
      <div class="ag-cell" col-id="name">Write report</div>
      <div class="ag-cell" col-id="done"><div class="ag-checkbox"><input type="checkbox" class="ag-checkbox-input" /></div></div>
      <div class="ag-cell" col-id="move"><button aria-label="Up"></button><button aria-label="Down"></button></div>
      <div class="ag-cell" col-id="actions"><button><span>Edit</span></button><button><span>Delete</span></button></div>
    </div>
    <div class="ag-row" row-index="1">
      <div class="ag-cell" col-id="name">Send invoice</div>
      <div class="ag-cell" col-id="done"><div class="ag-checkbox"><input type="checkbox" class="ag-checkbox-input" /></div></div>
      <div class="ag-cell" col-id="move"><button aria-label="Up"></button><button aria-label="Down"></button></div>
      <div class="ag-cell" col-id="actions"><button><span>Edit</span></button><button><span>Delete</span></button></div>
    </div>
  </div>
</div>`;

function selectorOptions({ blockId, options }) {
  return `
<div id="bl-${blockId}">
  <div class="ant-select ant-select-open">
    <div class="ant-select-selector"><input id="${blockId}_input" role="combobox" type="search" /></div>
  </div>
  <div id="${blockId}_123_popup">
    <div class="ant-select-dropdown">
      <div class="rc-virtual-list">
        ${options
          .map(
            (option) =>
              `<div class="ant-select-item ant-select-item-option" title="${option}"><div class="ant-select-item-option-content">${option}</div></div>`
          )
          .join('')}
      </div>
    </div>
  </div>
</div>`;
}

const targetFixtures = [
  {
    name: 'control inside a block',
    html: `
<div id="bl-page">
  <div id="bl-save_button"><button type="button" class="ant-btn"><span>Save</span></button></div>
</div>`,
    element: '#bl-save_button button',
    clicked: '#bl-save_button button span',
    target: target({ block_id: 'save_button', text: 'Save' }),
    blockIds: ['save_button', 'page'],
    resolvable: true,
    variants: [{ block_id: 'save_button' }],
  },
  {
    name: 'segmented option by label',
    html: `
<div id="bl-period">
  <div class="ant-segmented">
    <div class="ant-segmented-group">
      <label class="ant-segmented-item"><input class="ant-segmented-item-input" type="radio" /><div class="ant-segmented-item-label" title="Monthly">Monthly</div></label>
      <label class="ant-segmented-item"><input class="ant-segmented-item-input" type="radio" /><div class="ant-segmented-item-label" title="Yearly">Yearly</div></label>
    </div>
  </div>
</div>`,
    element: '#bl-period label:nth-of-type(2)',
    clicked: '#bl-period label:nth-of-type(2) div',
    target: target({ block_id: 'period', text: 'Yearly' }),
    blockIds: ['period'],
    resolvable: true,
    variants: [{ block_id: 'period', nth: 1 }],
  },
  {
    name: 'cell button by row and text',
    html: grid,
    element: '[row-index="1"] [col-id="actions"] button:nth-of-type(1)',
    clicked: '[row-index="1"] [col-id="actions"] button:nth-of-type(1) span',
    target: target({ block_id: 'tasks', row: 1, column: 'actions', text: 'Edit' }),
    blockIds: ['tasks'],
    resolvable: true,
    variants: [{ block_id: 'tasks', row: 1, text: 'Edit' }],
  },
  {
    name: 'control in a cell by row and column',
    html: grid,
    element: '[row-index="0"] [col-id="done"] input',
    target: target({ block_id: 'tasks', row: 0, column: 'done' }),
    blockIds: ['tasks'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'nth control in a cell',
    html: grid,
    element: '[row-index="1"] [col-id="move"] button:nth-of-type(2)',
    target: target({ block_id: 'tasks', row: 1, column: 'move', nth: 1 }),
    blockIds: ['tasks'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'first of several controls in a cell, by nth 0',
    html: grid,
    element: '[row-index="1"] [col-id="move"] button:nth-of-type(1)',
    target: target({ block_id: 'tasks', row: 1, column: 'move', nth: 0 }),
    blockIds: ['tasks'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'first of several same-text controls in a block, by nth 0',
    html: `
<div id="bl-toolbar">
  <button type="button" class="ant-btn"><span>Delete</span></button>
  <button type="button" class="ant-btn"><span>Delete</span></button>
</div>`,
    element: '#bl-toolbar button:nth-of-type(1)',
    clicked: '#bl-toolbar button:nth-of-type(1) span',
    target: target({ block_id: 'toolbar', text: 'Delete', nth: 0 }),
    blockIds: ['toolbar'],
    resolvable: true,
    variants: [{ block_id: 'toolbar', nth: 0 }],
  },
  {
    name: 'page-wide text in a dialog',
    html: `
<div id="bl-page"><div id="bl-delete_button"><button>Delete</button></div></div>
<div class="ant-modal-root">
  <div role="dialog" class="ant-modal">
    <div class="ant-modal-footer"><button><span>Cancel</span></button><button><span>Delete</span></button></div>
  </div>
</div>`,
    element: '[role="dialog"] button:nth-of-type(2)',
    clicked: '[role="dialog"] button:nth-of-type(2) span',
    target: target({ text: 'Delete' }),
    blockIds: [],
    resolvable: true,
    variants: [],
  },
  {
    name: 'page-wide text in a menu over a dialog',
    html: `
<div role="dialog" class="ant-modal"><button>Archive</button></div>
<ul role="menu" class="ant-dropdown-menu"><li role="menuitem" class="ant-dropdown-menu-item">Archive</li></ul>`,
    element: '[role="menuitem"]',
    target: target({ text: 'Archive' }),
    blockIds: [],
    resolvable: true,
    variants: [],
  },
  {
    name: 'page-wide text on the page',
    html: `
<div id="bl-page"><div id="bl-intro"><p>Welcome</p></div></div>
<div class="ant-popover"><div class="ant-popconfirm-buttons"><button><span>Confirm</span></button></div></div>`,
    element: '.ant-popover button',
    target: target({ text: 'Confirm' }),
    blockIds: [],
    resolvable: true,
    variants: [],
  },
  {
    name: 'text input',
    html: `
<div id="bl-name">
  <span class="ant-input-affix-wrapper"><input id="name_input" type="text" class="ant-input" /></span>
</div>`,
    element: '#name_input',
    target: target({ block_id: 'name' }),
    blockIds: ['name'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'Box with its own onClick and no inner control',
    html: `<div id="bl-order_card"><div class="box"><h4>Order 12</h4></div></div>`,
    element: '#bl-order_card',
    clicked: '#bl-order_card h4',
    target: target({ block_id: 'order_card' }),
    blockIds: ['order_card'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'Selector option inside its popup container',
    html: selectorOptions({ blockId: 'country', options: ['Germany', 'France'] }),
    element: '#bl-country [title="France"] .ant-select-item-option-content',
    target: target({ block_id: 'country', text: 'France', option: true }),
    blockIds: ['country'],
    resolvable: false,
    variants: [],
  },
  {
    name: 'AutoComplete option inside its popup container',
    html: selectorOptions({ blockId: 'fruit', options: ['Apple', 'Banana'] }),
    element: '#bl-fruit [title="Apple"]',
    clicked: '#bl-fruit [title="Apple"] .ant-select-item-option-content',
    target: target({ block_id: 'fruit', text: 'Apple', option: true }),
    blockIds: ['fruit'],
    resolvable: false,
    variants: [],
  },
  {
    name: 'Title inside a clickable Card',
    html: `
<div id="bl-card">
  <div class="ant-card"><div class="ant-card-body">
    <div id="bl-card_title"><h4 class="ant-typography">Orders</h4></div>
  </div></div>
</div>`,
    element: '#bl-card_title',
    clicked: '#bl-card_title h4',
    target: target({ block_id: 'card_title' }),
    blockIds: ['card_title', 'card'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'pinned grid row',
    html: `
<div id="bl-totals">
  <div class="ag-floating-top">
    <div class="ag-row ag-row-pinned" row-index="t-0">
      <div class="ag-cell" col-id="total"><button><span>Recalculate</span></button></div>
    </div>
  </div>
</div>`,
    element: '[col-id="total"] button',
    clicked: '[col-id="total"] button span',
    target: target({ block_id: 'totals', column: 'total', text: 'Recalculate' }),
    blockIds: ['totals'],
    resolvable: true,
    variants: [],
  },
];

export default targetFixtures;
