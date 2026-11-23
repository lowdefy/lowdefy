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

/**
 * @vitest-environment jsdom
 */

import { resolveTargetInDocument, targetFixtures } from '@lowdefy/e2e-utils/targets';

import { pageInstanceKey } from '@lowdefy/helpers';

import getTrace from './getTrace.js';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const TARGET_FIELDS = ['block_id', 'row', 'row_key', 'column', 'control', 'text', 'nth', 'option'];

function targetFields(target) {
  return Object.fromEntries(TARGET_FIELDS.map((field) => [field, target[field]]));
}

function createLowdefy() {
  return { basePath: '', contexts: {}, home: {}, _internal: { globals: { window } } };
}

function select(selector) {
  const element = document.querySelector(selector);
  if (element === null) {
    throw new Error(`Fixture selector "${selector}" matched nothing.`);
  }
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
  window.history.replaceState({}, '', '/');
});

describe.each(targetFixtures.map((fixture) => [fixture.name, fixture]))(
  'describeElement fixture: %s',
  (name, fixture) => {
    const { describeElement } = getTrace(createLowdefy());

    beforeEach(() => {
      document.body.innerHTML = fixture.html;
    });

    test('the element describes as the canonical target', () => {
      const described = describeElement(select(fixture.element));
      expect(targetFields(described)).toEqual(targetFields(fixture.target));
      expect(described.block_ids).toEqual(fixture.blockIds);
    });

    test('the element a click lands on describes as the same target', () => {
      const described = describeElement(select(fixture.clicked ?? fixture.element));
      expect(targetFields(described)).toEqual(targetFields(fixture.target));
      expect(described.block_ids).toEqual(fixture.blockIds);
    });

    if (fixture.resolvable) {
      test('the canonical target resolves to the element and describes back to itself', () => {
        const element = resolveTargetInDocument({ document, target: fixture.target });
        expect(element).toBe(select(fixture.element));
        expect(targetFields(describeElement(element))).toEqual(targetFields(fixture.target));
      });

      test('every runner target resolves to the same element after describing it', () => {
        [fixture.target, ...fixture.variants].forEach((target) => {
          const element = resolveTargetInDocument({ document, target });
          expect(element).toBe(select(fixture.element));
          const described = describeElement(element);
          expect(resolveTargetInDocument({ document, target: described })).toBe(element);
        });
      });
    }
  }
);

test('describeElement reads the block type from the context of the page the URL shows', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts['page:orders'] = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  document.body.innerHTML = targetFixtures[0].html;
  window.history.replaceState({}, '', '/orders');
  const described = getTrace(lowdefy).describeElement(select('#bl-save_button button'));
  expect(described.page_id).toBe('orders');
  expect(described.block_type).toBe('Button');
});

test('describeElement falls back to the app context for the block type', () => {
  const lowdefy = createLowdefy();
  lowdefy.appContext = {
    pageId: undefined,
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  document.body.innerHTML = targetFixtures[0].html;
  window.history.replaceState({}, '', '/orders');
  expect(getTrace(lowdefy).describeElement(select('#bl-save_button button')).block_type).toBe(
    'Button'
  );
});

test('describeElement gives a null block type for a block it cannot find', () => {
  document.body.innerHTML = targetFixtures[0].html;
  expect(
    getTrace(createLowdefy()).describeElement(select('#bl-save_button button')).block_type
  ).toBeNull();
});

test('describeElement skips hidden controls when it counts controls with the same text', () => {
  document.body.innerHTML = `
<div id="bl-tabs">
  <div class="pane" data-hidden="true"><button>Edit</button></div>
  <div class="pane"><button>Edit</button></div>
</div>`;
  const prototype = window.Element.prototype;
  prototype.checkVisibility = function checkVisibility() {
    return this.closest('[data-hidden="true"]') === null;
  };
  prototype.getBoundingClientRect = () => ({ height: 10, width: 10 });
  try {
    const visible = document.querySelectorAll('button')[1];
    expect(getTrace(createLowdefy()).describeElement(visible)).toMatchObject({
      block_id: 'tabs',
      text: 'Edit',
      nth: null,
    });
  } finally {
    delete prototype.checkVisibility;
    delete prototype.getBoundingClientRect;
  }
});

const MODAL_FOOTERS = `
<div class="ant-modal-root" style="display: none;">
  <div role="dialog"><button data-lf-block="delete_modal" data-lf-control="ok">OK</button></div>
</div>
<div class="ant-modal-root">
  <div role="dialog"><button id="open-ok" data-lf-block="delete_modal" data-lf-control="ok">OK</button></div>
</div>`;

test('resolveTargetInDocument skips a control the DOM hides, such as a closed modal', () => {
  document.body.innerHTML = MODAL_FOOTERS;
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'delete_modal', control: 'ok' } })
  ).toBe(select('#open-ok'));
});

test('resolveTargetInDocument resolves no control when several visible elements match', () => {
  document.body.innerHTML = MODAL_FOOTERS.replace(' style="display: none;"', '');
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'delete_modal', control: 'ok' } })
  ).toBeNull();
});

test('resolveTargetInDocument narrows a control to the cell of its column', () => {
  document.body.innerHTML = `
<div id="bl-grid"><div class="ag-row" row-index="0" row-id="r1">
  <div class="ag-cell" col-id="a"><button id="in-a" data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1">Go</button></div>
  <div class="ag-cell" col-id="b"><button id="in-b" data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1">Go</button></div>
</div></div>`;
  const target = { block_id: 'grid', row_key: 'r1', control: 'go' };
  expect(resolveTargetInDocument({ document, target })).toBeNull();
  expect(resolveTargetInDocument({ document, target: { ...target, column: 'b' } })).toBe(
    select('#in-b')
  );
});

test('resolveTargetInDocument refuses a generated row key, as the runner does', () => {
  document.body.innerHTML = `
<div id="bl-grid"><div class="ag-row" row-index="0" row-id="__row_0">
  <div class="ag-cell" col-id="a" aria-colindex="1"><button data-lf-block="grid" data-lf-control="go" data-lf-row-key="__row_0">Go</button></div>
</div></div>`;
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'grid', row_key: '__row_0' } })
  ).toBeNull();
  expect(
    resolveTargetInDocument({
      document,
      target: { block_id: 'grid', row_key: '__row_0', control: 'go' },
    })
  ).toBeNull();
});

test('resolveTargetInDocument refuses a row key several rows carry, but not a row split across pinned containers', () => {
  document.body.innerHTML = `
<div id="bl-grid">
  <div class="ag-pinned-left-cols-container"><div class="ag-row" row-index="0" row-id="r1">
    <div id="r1-first" class="ag-cell" col-id="a" aria-colindex="1">A</div>
  </div></div>
  <div class="ag-center-cols-container"><div class="ag-row" row-index="0" row-id="r1">
    <div class="ag-cell" col-id="b" aria-colindex="2">B</div>
  </div></div>
</div>`;
  const target = { block_id: 'grid', row_key: 'r1' };
  expect(resolveTargetInDocument({ document, target })).toBe(select('#r1-first'));
  document.body.innerHTML = `
<div id="bl-grid">
  <div class="ag-row" row-index="0" row-id="r1"><div class="ag-cell" col-id="a" aria-colindex="1">A</div></div>
  <div class="ag-row" row-index="1" row-id="r1"><div class="ag-cell" col-id="a" aria-colindex="1">A</div></div>
</div>`;
  expect(resolveTargetInDocument({ document, target })).toBeNull();
  expect(resolveTargetInDocument({ document, target: { ...target, column: 'a' } })).toBeNull();
});

test('describeElement names a modal button by its control and block type', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts['page:orders'] = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { delete_modal: { type: 'Modal' } } } },
  };
  document.body.innerHTML = MODAL_FOOTERS;
  window.history.replaceState({}, '', '/orders');
  expect(getTrace(lowdefy).describeElement(select('#open-ok'))).toMatchObject({
    page_id: 'orders',
    block_id: 'delete_modal',
    block_type: 'Modal',
    control: 'ok',
    text: null,
    block_ids: ['delete_modal'],
  });
});

test('describeChain parses the chain and adds the page id and block type', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts['page:orders'] = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  window.history.replaceState({}, '', '/orders');
  const chain =
    'span:nth-child="1"nth-of-type="1"text="Save";button:nth-child="1"nth-of-type="1"text="Save";div:attr__id="bl-save_button"attr_id="bl-save_button"nth-child="1"nth-of-type="1"';
  expect(getTrace(lowdefy).describeChain(chain)).toEqual({
    page_id: 'orders',
    block_id: 'save_button',
    block_type: 'Button',
    row: null,
    column: null,
    control: null,
    text: 'Save',
    nth: null,
    option: false,
    block_ids: ['save_button'],
  });
});

test('describeChain reads a marked cell control by its key and displayed row, with no row key', () => {
  const lowdefy = createLowdefy();
  lowdefy.contexts['page:orders'] = {
    pageId: 'orders',
    _internal: { RootSlots: { map: { invoices: { type: 'AgGridAlpine' } } } },
  };
  window.history.replaceState({}, '', '/orders');
  const chain =
    'span:text="Pay";button:attr__data-lf-block="invoices"attr__data-lf-control="onPay"attr__data-lf-row-key="inv-2"text="Pay";div.ag-cell:attr__class="ag-cell"attr__col-id="actions";div.ag-row:attr__class="ag-row"attr__row-id="inv-2"attr__row-index="1";div:attr__id="bl-invoices"attr_id="bl-invoices"';
  const described = getTrace(lowdefy).describeChain(chain);
  expect(described).toEqual({
    page_id: 'orders',
    block_id: 'invoices',
    block_type: 'AgGridAlpine',
    row: 1,
    column: 'actions',
    control: 'onPay',
    text: null,
    nth: null,
    option: false,
    block_ids: ['invoices'],
  });
  expect(described).not.toHaveProperty('row_key');
});

function rememberTicket(lowdefy) {
  lowdefy.pathMemory = new Map();
  lowdefy.pathMemory.set('tickets/s/1', {
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
    instanceKey: pageInstanceKey({
      pageId: 'ticket',
      path: 'tickets/{space}/{ticket_id}',
      pathParams: { space: 's', ticket_id: '1' },
    }),
  });
}

test('pageIdOf reads the page id from the path memory', () => {
  const lowdefy = createLowdefy();
  rememberTicket(lowdefy);
  expect(getTrace(lowdefy).pageIdOf('https://example.com/tickets/s/1')).toBe('ticket');
});

test('pageIdOf gives the path for a path the path memory has not seen', () => {
  const lowdefy = createLowdefy();
  rememberTicket(lowdefy);
  expect(getTrace(lowdefy).pageIdOf('https://example.com/orders/list')).toBe('orders/list');
});

test('pageIdOf strips the basePath before it reads the path memory', () => {
  const lowdefy = { ...createLowdefy(), basePath: '/app' };
  rememberTicket(lowdefy);
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app/tickets/s/1')).toBe('ticket');
});

test('pathEntryOf gives the path params of the remembered path', () => {
  const lowdefy = createLowdefy();
  rememberTicket(lowdefy);
  expect(getTrace(lowdefy).pathEntryOf('https://example.com/tickets/s/1')).toMatchObject({
    pageId: 'ticket',
    pathParams: { space: 's', ticket_id: '1' },
  });
});

test('pathEntryOf gives no path params for a path without an entry', () => {
  expect(getTrace(createLowdefy()).pathEntryOf('https://example.com/orders').pathParams).toEqual(
    {}
  );
});

test('describeElement reads the block type from the page instance the URL shows', () => {
  const lowdefy = createLowdefy();
  rememberTicket(lowdefy);
  const instanceKey = lowdefy.pathMemory.get('tickets/s/1').instanceKey;
  const otherKey = pageInstanceKey({
    pageId: 'ticket',
    path: 'tickets/{space}/{ticket_id}',
    pathParams: { space: 's', ticket_id: '2' },
  });
  lowdefy.contexts[otherKey] = {
    pageId: 'ticket',
    _internal: { RootSlots: { map: { save_button: { type: 'Anchor' } } } },
  };
  lowdefy.contexts[instanceKey] = {
    pageId: 'ticket',
    _internal: { RootSlots: { map: { save_button: { type: 'Button' } } } },
  };
  document.body.innerHTML = targetFixtures[0].html;
  window.history.replaceState({}, '', '/tickets/s/1');
  const described = getTrace(lowdefy).describeElement(select('#bl-save_button button'));
  expect(described.page_id).toBe('ticket');
  expect(described.block_type).toBe('Button');
});

test('pageIdOf strips the basePath', () => {
  const lowdefy = { ...createLowdefy(), basePath: '/app' };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app/orders/list?x=1')).toBe('orders/list');
});

test('pageIdOf gives the configured home page at the app root', () => {
  const lowdefy = {
    ...createLowdefy(),
    basePath: '/app',
    home: { configured: true, pageId: 'home' },
  };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app/')).toBe('home');
  expect(getTrace(lowdefy).pageIdOf('https://example.com/app')).toBe('home');
});

test('pageIdOf gives null at the app root without a configured home page', () => {
  const lowdefy = { ...createLowdefy(), home: { configured: false, pageId: 'first' } };
  expect(getTrace(lowdefy).pageIdOf('https://example.com/')).toBeNull();
});

test('pageIdOf works before the client initialises lowdefy', () => {
  expect(getTrace({}).pageIdOf('https://example.com/orders')).toBe('orders');
  expect(getTrace({}).pageIdOf('https://example.com/')).toBeNull();
});

test('a text target with no nth resolves to nothing when several controls match, as the runner refuses it', () => {
  document.body.innerHTML = `
<div id="bl-toolbar">
  <button type="button"><span>Delete</span></button>
  <button type="button"><span>Delete</span></button>
</div>`;
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'toolbar', text: 'Delete' } })
  ).toBeNull();
  expect(resolveTargetInDocument({ document, target: { text: 'Delete' } })).toBeNull();
  expect(
    resolveTargetInDocument({ document, target: { block_id: 'toolbar', text: 'Delete', nth: 1 } })
  ).toBe(select('#bl-toolbar button:nth-of-type(2)'));
});

test('describeElement gives nth null for a control that is the only match in its scope', () => {
  document.body.innerHTML = `
<div id="bl-toolbar">
  <button type="button"><span>Save</span></button>
  <button type="button"><span>Delete</span></button>
</div>`;
  const { describeElement } = getTrace(createLowdefy());
  expect(describeElement(select('#bl-toolbar button:nth-of-type(1)')).nth).toBeNull();
  expect(describeElement(select('#bl-toolbar button:nth-of-type(2)')).nth).toBeNull();
});

test('describeElement describes a page layout nav item by its text on the layout block', () => {
  // A page layout draws its nav Menu under a made-up id (`layout_menu`) with no journey marks.
  document.body.innerHTML = `
<div id="bl-layout">
  <ul id="layout_menu" role="menu">
    <li role="menuitem"><a href="/home"><span>Home</span></a></li>
    <li role="menuitem"><a href="/orders"><span>Orders</span></a></li>
  </ul>
</div>`;
  expect(getTrace(createLowdefy()).describeElement(select('a[href="/home"] span'))).toMatchObject({
    block_id: 'layout',
    control: null,
    row_key: null,
    text: 'Home',
    block_ids: ['layout'],
  });
});

const PINNED_GRID = `
<div id="bl-grid">
  <div class="ag-floating-top"><div class="ag-row" row-index="t-0" row-id="t-0">
    <div class="ag-cell" col-id="actions" aria-colindex="1"><button id="pinned-go" data-lf-block="grid" data-lf-control="go" data-lf-row-key="t-0"><span>Go</span></button></div>
  </div></div>
  <div class="ag-center-cols-container"><div class="ag-row" row-index="0" row-id="r1">
    <div class="ag-cell" col-id="actions" aria-colindex="1"><button id="row-go" data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1"><span>Go</span></button></div>
  </div></div>
</div>`;

test('describeElement describes a cell control in a pinned row by its text, with no row key', () => {
  document.body.innerHTML = PINNED_GRID;
  const { describeElement } = getTrace(createLowdefy());
  expect(targetFields(describeElement(select('#pinned-go span')))).toEqual({
    block_id: 'grid',
    row: null,
    row_key: null,
    column: 'actions',
    control: null,
    text: 'Go',
    nth: null,
    option: false,
  });
  expect(describeElement(select('#row-go span'))).toMatchObject({
    row: 0,
    row_key: 'r1',
    control: 'go',
  });
});

test('describeElement describes a pinned row cell menu item in its popup by its text', () => {
  document.body.innerHTML = `${PINNED_GRID}
<div class="ant-dropdown"><ul role="menu">
  <li id="pinned-edit" role="menuitem" data-lf-block="grid" data-lf-control="onEdit" data-lf-row-key="t-0"><span>Edit</span></li>
</ul></div>`;
  expect(getTrace(createLowdefy()).describeElement(select('#pinned-edit span'))).toMatchObject({
    block_id: null,
    row_key: null,
    control: null,
    text: 'Edit',
  });
});

test('describeElement keeps the row index, not the key, when several rows carry the key', () => {
  document.body.innerHTML = `
<div id="bl-grid">
  <div class="ag-row" row-index="0" row-id="r1">
    <div class="ag-cell" col-id="name" aria-colindex="1">Ann</div>
    <div class="ag-cell" col-id="actions" aria-colindex="2"><button data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1"><span>Go</span></button></div>
  </div>
  <div class="ag-row" row-index="1" row-id="r1">
    <div id="second-name" class="ag-cell" col-id="name" aria-colindex="1">Bob</div>
    <div class="ag-cell" col-id="actions" aria-colindex="2"><button id="second-go" data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1"><span>Go</span></button></div>
  </div>
</div>`;
  const { describeElement } = getTrace(createLowdefy());
  expect(describeElement(select('#second-name'))).toMatchObject({
    block_id: 'grid',
    row: 1,
    row_key: null,
    column: 'name',
  });
  expect(describeElement(select('#second-go span'))).toMatchObject({
    block_id: 'grid',
    row: 1,
    row_key: null,
    column: 'actions',
    control: null,
    text: 'Go',
  });
});

test('describeElement keeps the key of a row AG Grid splits across pinned containers', () => {
  document.body.innerHTML = `
<div id="bl-grid">
  <div class="ag-pinned-left-cols-container"><div class="ag-row" row-index="0" row-id="r1">
    <div class="ag-cell" col-id="name" aria-colindex="1">Ann</div>
  </div></div>
  <div class="ag-center-cols-container"><div class="ag-row" row-index="0" row-id="r1">
    <div class="ag-cell" col-id="actions" aria-colindex="2"><button id="split-go" data-lf-block="grid" data-lf-control="go" data-lf-row-key="r1"><span>Go</span></button></div>
  </div></div>
</div>`;
  expect(getTrace(createLowdefy()).describeElement(select('#split-go span'))).toMatchObject({
    row: 0,
    row_key: 'r1',
    control: 'go',
  });
});

test('describeElement names a ClickableHtml element by its control only when no other visible element carries its marks', () => {
  const { describeElement } = getTrace(createLowdefy());
  document.body.innerHTML = `
<div id="bl-list"><div id="list" data-lf-html="">
  <span data-event="onAdd" data-lf-block="list" data-lf-control="onAdd" role="button">Add</span>
  <span data-event="onAdd" data-lf-block="list" data-lf-control="onAdd" role="button">Add more</span>
  <span id="one" data-event="onClear" data-lf-block="list" data-lf-control="onClear" role="button">Clear</span>
  <div data-popover-content="more" hidden><span data-event="onClear" data-lf-block="list" data-lf-control="onClear">Clear</span></div>
</div></div>`;
  expect(targetFields(describeElement(select('[data-lf-control="onAdd"]')))).toEqual({
    block_id: 'list',
    row: null,
    row_key: null,
    column: null,
    control: null,
    text: 'Add',
    nth: null,
    option: false,
  });
  expect(targetFields(describeElement(select('#one')))).toMatchObject({
    block_id: 'list',
    control: 'onClear',
    text: null,
  });
});

test('describeElement keeps a cell control whose key another cell of its row shares, by its column', () => {
  const { describeElement } = getTrace(createLowdefy());
  document.body.innerHTML = `
<div id="bl-people"><div class="lf-table">
  <div class="lf-table-row" data-row-index="0" data-row-key="a1">
    <div class="lf-table-gridcell" role="gridcell" data-col-key="active"><button id="first" data-lf-block="people" data-lf-control="onToggle" data-lf-row-key="a1">On</button></div>
    <div class="lf-table-gridcell" role="gridcell" data-col-key="admin"><button data-lf-block="people" data-lf-control="onToggle" data-lf-row-key="a1">On</button></div>
  </div>
</div></div>`;
  expect(targetFields(describeElement(select('#first')))).toMatchObject({
    block_id: 'people',
    row_key: 'a1',
    column: 'active',
    control: 'onToggle',
  });
});
