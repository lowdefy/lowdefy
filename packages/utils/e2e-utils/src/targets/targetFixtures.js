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

// A ClickableHtml block as HtmlComponent draws it: each data-event element its dataEvents lists
// marked with the block, its event and its data-id (markDataEventControls).
const clickableHtml = `
<div id="bl-page"><div id="bl-issues"><div id="issues" data-testid="issues" data-lf-html="">
  <div data-event="onOpen" data-id="issue-1" data-lf-block="issues" data-lf-control="onOpen" data-lf-row-key="issue-1" tabindex="0"><b>micromatch</b> 1 advisory <button data-event="onMerge" data-id="issue-1" data-lf-block="issues" data-lf-control="onMerge" data-lf-row-key="issue-1">Merge</button></div>
  <div data-event="onOpen" data-id="issue-2" data-lf-block="issues" data-lf-control="onOpen" data-lf-row-key="issue-2" tabindex="0"><b>lodash</b> 2 advisories</div>
</div></div></div>`;

function target(fields) {
  return {
    block_id: null,
    row: null,
    row_key: null,
    column: null,
    control: null,
    text: null,
    nth: null,
    option: false,
    ...fields,
  };
}

const grid = `
<div id="bl-tasks" class="ag-theme-quartz">
  <div class="ag-grid-scrolling-container">
    <div class="ag-row" row-index="0" row-id="__row_0">
      <div class="ag-cell" col-id="name">Write report</div>
      <div class="ag-cell" col-id="done"><div class="ag-checkbox"><input type="checkbox" class="ag-checkbox-input" /></div></div>
      <div class="ag-cell" col-id="move"><button aria-label="Up"></button><button aria-label="Down"></button></div>
      <div class="ag-cell" col-id="actions"><button data-lf-block="tasks" data-lf-control="onEdit" data-lf-row-key="__row_0"><span>Edit</span></button><button data-lf-block="tasks" data-lf-control="onDelete" data-lf-row-key="__row_0"><span>Delete</span></button></div>
    </div>
    <div class="ag-row" row-index="1" row-id="__row_1">
      <div class="ag-cell" col-id="name">Send invoice</div>
      <div class="ag-cell" col-id="done"><div class="ag-checkbox"><input type="checkbox" class="ag-checkbox-input" /></div></div>
      <div class="ag-cell" col-id="move"><button aria-label="Up"></button><button aria-label="Down"></button></div>
      <div class="ag-cell" col-id="actions"><button data-lf-block="tasks" data-lf-control="onEdit" data-lf-row-key="__row_1"><span>Edit</span></button><button data-lf-block="tasks" data-lf-control="onDelete" data-lf-row-key="__row_1"><span>Delete</span></button></div>
    </div>
  </div>
</div>`;

// An AG Grid whose rows have their own ids, with the cells out of display order (AG Grid's
// ensureDomOrder is off) and a marked cell button.
const keyedGrid = `
<div id="bl-invoices" class="ag-theme-quartz">
  <div class="ag-grid-scrolling-container">
    <div class="ag-row" row-index="0" row-id="inv-1">
      <div class="ag-cell" col-id="actions" aria-colindex="2"><button data-lf-block="invoices" data-lf-control="onPay" data-lf-row-key="inv-1"><span>Pay</span></button></div>
      <div class="ag-cell" col-id="name" aria-colindex="1">Rent</div>
    </div>
    <div class="ag-row" row-index="1" row-id="inv-2">
      <div class="ag-cell" col-id="actions" aria-colindex="2"><button data-lf-block="invoices" data-lf-control="onPay" data-lf-row-key="inv-2"><span>Pay</span></button></div>
      <div class="ag-cell" col-id="name" aria-colindex="1">Power</div>
    </div>
  </div>
</div>`;

const tableGrid = `
<div id="bl-people">
  <div class="lf-table" role="grid">
    <div class="lf-table-header">
      <div class="lf-table-row lf-table-group-row" role="row">
        <div class="lf-table-gridcell" data-group="person" role="columnheader"><button aria-label="Collapse"></button></div>
      </div>
      <div class="lf-table-row" data-row-index="-1" role="row">
        <div class="lf-table-gridcell" data-col-key="select" data-lf-cell="" data-lf-header="" role="columnheader"><input type="checkbox" /></div>
        <div class="lf-table-gridcell" data-col-key="name" data-lf-cell="" data-lf-header="" role="columnheader"><span>Name</span></div>
        <div class="lf-table-gridcell" data-col-key="actions" data-lf-cell="" data-lf-header="" role="columnheader"><span>Actions</span></div>
      </div>
    </div>
    <div class="lf-table-body">
      <div class="lf-table-row" data-row-index="0" data-row-key="a1" role="row">
        <div class="lf-table-gridcell" data-col-key="name" role="gridcell" aria-colindex="1">Jane</div>
        <div class="lf-table-gridcell" data-col-key="actions" role="gridcell" aria-colindex="2"><button><span>Edit</span></button><button><span>Delete</span></button></div>
      </div>
      <div class="lf-table-row" data-row-index="1" data-row-key="b2" role="row">
        <div class="lf-table-gridcell" data-col-key="name" role="gridcell" aria-colindex="1">Sam</div>
        <div class="lf-table-gridcell" data-col-key="actions" role="gridcell" aria-colindex="2"><button><span>Edit</span></button><button><span>Delete</span></button></div>
      </div>
    </div>
    <div class="lf-table-footer" role="rowgroup">
      <div class="lf-table-row lf-table-summary-row" data-summary="row" role="row">
        <div class="lf-table-gridcell" data-col-key="actions" role="gridcell"><button><span>Export</span></button></div>
      </div>
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
    name: 'cell button in a row with a generated key, by row and text',
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
    name: 'Table cell button by row and text',
    html: tableGrid,
    element: '[data-row-index="1"] [data-col-key="actions"] button:nth-of-type(1)',
    clicked: '[data-row-index="1"] [data-col-key="actions"] button:nth-of-type(1) span',
    target: target({ block_id: 'people', row: 1, row_key: 'b2', column: 'actions', text: 'Edit' }),
    blockIds: ['people'],
    resolvable: true,
    variants: [{ block_id: 'people', row: 1, text: 'Edit' }],
  },
  {
    name: 'Table row button, by row and text only',
    html: tableGrid,
    element: '[data-row-index="0"] [data-col-key="actions"] button:nth-of-type(2)',
    clicked: '[data-row-index="0"] [data-col-key="actions"] button:nth-of-type(2) span',
    target: target({
      block_id: 'people',
      row: 0,
      row_key: 'a1',
      column: 'actions',
      text: 'Delete',
    }),
    blockIds: ['people'],
    resolvable: true,
    variants: [{ block_id: 'people', row: 0, text: 'Delete' }],
  },
  {
    name: 'Table header cell is no row or cell',
    html: tableGrid,
    element: '[role="columnheader"][data-col-key="name"]',
    target: target({ block_id: 'people' }),
    blockIds: ['people'],
    resolvable: false,
    variants: [],
  },
  {
    name: 'Table header control is counted across the block, not the header row',
    html: tableGrid,
    element: '[data-row-index="-1"] input[type="checkbox"]',
    target: target({ block_id: 'people', nth: 1 }),
    blockIds: ['people'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'Table summary row control is in no row or cell',
    html: tableGrid,
    element: '.lf-table-summary-row button',
    clicked: '.lf-table-summary-row button span',
    target: target({ block_id: 'people', text: 'Export' }),
    blockIds: ['people'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'pinned grid row',
    html: `
<div id="bl-totals">
  <div class="ag-grid-pinned-top-rows-container">
    <div class="ag-row ag-row-pinned" row-index="t-0" row-id="t-0">
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
  {
    name: 'Modal OK button in its portal, by control',
    html: `
<div id="bl-page"><div id="bl-delete_modal"></div></div>
<div class="ant-modal-root ldf-portal-delete_modal">
  <div role="dialog" class="ant-modal">
    <div class="ant-modal-footer">
      <button data-lf-block="delete_modal" data-lf-control="cancel"><span>Cancel</span></button>
      <button data-lf-block="delete_modal" data-lf-control="ok"><span>OK</span></button>
    </div>
  </div>
</div>`,
    element: '[data-lf-control="ok"]',
    clicked: '[data-lf-control="ok"] span',
    target: target({ block_id: 'delete_modal', control: 'ok' }),
    blockIds: ['delete_modal'],
    resolvable: true,
    variants: [{ text: 'OK' }],
  },
  {
    name: 'dropdown menu item in a document.body popup, by control',
    html: `
<div id="bl-page"><div id="bl-actions"><button class="ant-dropdown-trigger"><span>Actions</span></button></div></div>
<div class="ant-dropdown">
  <ul role="menu" class="ant-dropdown-menu">
    <li role="menuitem" class="ant-dropdown-menu-item" data-lf-block="actions" data-lf-control="archive"><span>Archive</span></li>
    <li role="menuitem" class="ant-dropdown-menu-item" data-lf-block="actions" data-lf-control="restore"><span>Restore</span></li>
  </ul>
</div>`,
    element: '[data-lf-control="archive"]',
    clicked: '[data-lf-control="archive"] span',
    target: target({ block_id: 'actions', control: 'archive' }),
    blockIds: ['actions'],
    resolvable: true,
    variants: [{ text: 'Archive' }],
  },
  {
    name: 'AgGrid cell button in a keyed row, by control and row key',
    html: keyedGrid,
    element: '[row-id="inv-2"] button',
    clicked: '[row-id="inv-2"] button span',
    target: target({
      block_id: 'invoices',
      row: 1,
      row_key: 'inv-2',
      column: 'actions',
      control: 'onPay',
    }),
    blockIds: ['invoices'],
    resolvable: true,
    variants: [
      { block_id: 'invoices', row_key: 'inv-2', control: 'onPay' },
      { block_id: 'invoices', row_key: 'inv-2', column: 'actions', text: 'Pay' },
      { block_id: 'invoices', row: 1, column: 'actions', text: 'Pay' },
    ],
  },
  {
    name: 'AgGrid cell in a keyed row, the first cell by aria-colindex',
    html: keyedGrid,
    element: '[row-id="inv-1"] [col-id="name"]',
    target: target({ block_id: 'invoices', row: 0, row_key: 'inv-1', column: 'name' }),
    blockIds: ['invoices'],
    resolvable: true,
    variants: [{ block_id: 'invoices', row_key: 'inv-1' }],
  },
  {
    name: 'Table cell in a keyed row, by row key and column',
    html: tableGrid,
    element: '[data-row-key="a1"] [data-col-key="name"]',
    target: target({ block_id: 'people', row: 0, row_key: 'a1', column: 'name' }),
    blockIds: ['people'],
    resolvable: true,
    variants: [{ block_id: 'people', row_key: 'a1' }],
  },
  {
    name: 'ClickableHtml element by its data-event and data-id, by control and row key',
    html: clickableHtml,
    element: '[data-lf-row-key="issue-2"]',
    clicked: '[data-lf-row-key="issue-2"] b',
    target: target({ block_id: 'issues', row_key: 'issue-2', control: 'onOpen' }),
    blockIds: ['issues', 'page'],
    resolvable: true,
    variants: [],
  },
  {
    name: 'ClickableHtml button inside an element of another event, by its own control',
    html: clickableHtml,
    element: '[data-lf-control="onMerge"][data-lf-row-key="issue-1"]',
    target: target({ block_id: 'issues', row_key: 'issue-1', control: 'onMerge' }),
    blockIds: ['issues', 'page'],
    resolvable: true,
    variants: [],
  },
];

export default targetFixtures;
