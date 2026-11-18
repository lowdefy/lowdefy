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

import { fixtureTest, postBrowserJourney } from './fixtureClient.mjs';
import { expect } from 'vitest';

// The browser runner's rowKey and control targets (LDF-1044), run by the real runner over the
// fixture app's controls page. Each control carries data-lf-block and data-lf-control (and
// data-lf-row-key in a grid cell), so it is found wherever antd draws it. The headless runner has
// no stand-ins for these blocks yet, so these journeys post without the parity check.

function lastIs(value) {
  return { expect: { state: { path: 'last', equals: value } } };
}

const contentNotClicked = { expect: { state: { path: 'content_clicked', equals: null } } };

fixtureTest('a Modal ok control clicks the OK button in its portal footer', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    steps: [
      { click: 'open_edit_modal_button' },
      { click: { blockId: 'edit_modal', control: 'ok' } },
      lastIs('modal-ok'),
      { expect: { hidden: { blockId: 'edit_modal', text: 'OK' } } },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a ConfirmModal cancel control clicks Cancel in its modal.confirm dialog', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    steps: [
      { click: 'open_confirm_dialog_button' },
      { click: { blockId: 'confirm_dialog', control: 'cancel' } },
      lastIs('confirm-cancel'),
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  'a DropdownButton item control opens a closed dropdown first, and follows an open',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'controls',
      steps: [
        { click: { blockId: 'actions_dropdown', control: 'onArchive' } },
        lastIs('archive'),
        { open: 'actions_dropdown' },
        { click: { blockId: 'actions_dropdown', control: 'onExport' } },
        lastIs('export'),
        // The closed popup stays in the DOM, hidden: the runner opens the dropdown again.
        { click: { blockId: 'actions_dropdown', control: 'onArchive' } },
        lastIs('archive'),
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest(
  'a hover DropdownMenu item control hovers its trigger, so its content is never clicked',
  async () => {
    const result = await postBrowserJourney({
      pageId: 'controls',
      steps: [
        { click: { blockId: 'account_menu', control: 'billing' } },
        lastIs('menu-billing'),
        contentNotClicked,
        { open: 'account_menu' },
        { click: { blockId: 'account_menu', control: 'settings' } },
        lastIs('menu-settings'),
        contentNotClicked,
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest('an AgGrid row by key is clicked on its first displayed cell', async () => {
  // The pinned Number column is listed last in columnDefs and drawn first.
  const result = await postBrowserJourney({
    pageId: 'controls',
    steps: [{ click: { blockId: 'invoices_grid', rowKey: 'inv-2' } }, lastIs('cell-inv-2-number')],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest(
  "an AgGrid menu item by row key opens that row's menu, past other rows' closed popups",
  async () => {
    const result = await postBrowserJourney({
      pageId: 'controls',
      steps: [
        { click: { blockId: 'invoices_grid', rowKey: 'inv-1', control: 'onVoid' } },
        lastIs('void-inv-1'),
        { click: { blockId: 'invoices_grid', rowKey: 'inv-2', control: 'onVoid' } },
        lastIs('void-inv-2'),
        {
          click: { blockId: 'invoices_grid', rowKey: 'inv-1', column: 'menu', control: 'onRemind' },
        },
        lastIs('remind-inv-1'),
      ],
    });
    expect(result.failure).toBeUndefined();
    expect(result.passed).toBe(true);
  }
);

fixtureTest('a Table button by row key hovers the row to show its hover-only button', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    steps: [
      { click: { blockId: 'tickets_table', rowKey: 't-2', control: 'onReply' } },
      lastIs('reply-t-2'),
      { click: { blockId: 'tickets_table', rowKey: 't-1', control: 'onOpenTicket' } },
      lastIs('open-t-1'),
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('expectations resolve a row and a cell by key', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    steps: [
      { expect: { visible: { blockId: 'invoices_grid', rowKey: 'inv-3' } } },
      { expect: { hidden: { blockId: 'invoices_grid', rowKey: 'inv-9' } } },
      {
        expect: {
          text: {
            blockId: 'invoices_grid',
            rowKey: 'inv-3',
            column: 'customer',
            contains: 'Initech',
          },
        },
      },
    ],
  });
  expect(result.failure).toBeUndefined();
  expect(result.passed).toBe(true);
});

fixtureTest('a generated row key is refused before the click, with the fix', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    timeout: 2000,
    steps: [
      { expect: { visible: 'plain_grid' } },
      { click: { blockId: 'plain_grid', rowKey: '__row_1' } },
    ],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(1);
  expect(result.failure.message).toBe(
    'Row key "__row_1" is a key block "plain_grid" (AgGridAlpine) generated for a row with no key of its own, and it changes between renders: give rows an `id` or set `rowId`, and name the row by that key.'
  );
  expect(result.failure.actual).toBe('the generated row key "__row_1"');
});

fixtureTest('a row key no row carries fails as not actionable', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    timeout: 1000,
    steps: [{ click: { blockId: 'invoices_grid', rowKey: 'inv-9' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toMatch(
    /^Block "invoices_grid" row key "inv-9" was not actionable: /
  );
});

fixtureTest('a control that matches two visible elements fails with the count', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    timeout: 2000,
    steps: [{ click: { blockId: 'tickets_table', control: 'onOpenTicket' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.message).toBe(
    'Matched 2 visible controls for block "tickets_table" control key "onOpenTicket"; add a rowKey (and a column) to name one.'
  );
  expect(result.failure.actual).toBe('2 controls');
});

fixtureTest('a control that never shows fails naming it', async () => {
  const result = await postBrowserJourney({
    pageId: 'controls',
    timeout: 1000,
    steps: [{ click: { blockId: 'edit_modal', control: 'ok' } }],
  });
  expect(result.passed).toBe(false);
  expect(result.failure.message).toBe(
    'No visible control for block "edit_modal" control key "ok" showed within 1000 ms.'
  );
});
