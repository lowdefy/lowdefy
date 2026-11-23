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

import { expect, test } from 'vitest';

import runTestJourney, { methodButton } from '../tests/runTestJourney.js';

function page(blocks, extra = {}) {
  return { id: 'home', blocks, ...extra };
}

function textCheck(blockId, contains) {
  return { expect: { text: { blockId, contains } } };
}

async function check({ blocks, contains, blockId = 'home', steps = [], i18n, stepTimeout }) {
  const { result } = await runTestJourney({
    i18n,
    pages: [page(blocks)],
    steps: [...steps, textCheck(blockId, contains)],
    stepTimeout,
  });
  return result;
}

const nested = [
  {
    id: 'card',
    type: 'Card',
    properties: { title: 'Company' },
    blocks: [
      {
        id: 'inner',
        type: 'Box',
        blocks: [
          { id: 'status', type: 'Icon', properties: { name: 'check' } },
          {
            id: 'name',
            type: 'Html',
            properties: { html: '<p>\n  <b>Acme</b>   Ltd\n</p><p>3 contacts</p>' },
          },
        ],
      },
    ],
  },
];

test('a text check passes on text a nested block draws, with its white space collapsed', async () => {
  expect((await check({ blocks: nested, contains: 'Acme Ltd' })).passed).toBe(true);
  expect((await check({ blocks: nested, contains: 'Company' })).passed).toBe(true);
  expect((await check({ blocks: nested, blockId: 'inner', contains: '3 contacts' })).passed).toBe(
    true
  );
});

test('a text check fails as the browser does when no block could show the text', async () => {
  const result = await check({ blocks: nested, blockId: 'inner', contains: 'Beta Corp' });
  expect(result.passed).toBe(false);
  expect(result.failure.index).toBe(0);
  expect(result.failure.message).toBe(
    'Expected block "inner" text to contain "Beta Corp" but found "Acme Ltd\\n3 contacts".'
  );
});

test('a text check that may run across elements a layout breaks runs in a browser', async () => {
  const result = await check({ blocks: nested, blockId: 'inner', contains: 'Ltd 3 contacts' });
  expect(result.browserOnly.reason).toBe(
    'Block "inner" may show "Ltd 3 contacts" across its text, as a layout a headless page does not know draws it: the step runs in a browser.'
  );
});

test('a text check reads a case the CSS may change as open, never as missing', async () => {
  const blocks = [
    { id: 'label', type: 'Html', properties: { html: '<span class="uppercase">draft</span>' } },
  ];
  expect((await check({ blocks, contains: 'DRAFT' })).browserOnly.reason).toContain(
    'may show "DRAFT" across its text'
  );
  expect((await check({ blocks, contains: 'draft' })).browserOnly.reason).toContain(
    'may show "draft"'
  );
});

const modal = {
  id: 'dialog',
  type: 'Modal',
  properties: { title: 'Edit company' },
  blocks: [{ id: 'dialog_body', type: 'Html', properties: { html: 'Inside the dialog' } }],
};
const openButton = methodButton({
  id: 'open',
  blockId: 'dialog',
  method: 'setOpen',
  args: [{ open: true }],
});

test("a text in a closed Modal is not found, and is once it opens, in the Modal's own text", async () => {
  const closed = await check({
    blocks: [openButton, modal],
    blockId: 'dialog',
    contains: 'Inside',
  });
  expect(closed.passed).toBe(false);
  expect(closed.failure.message).toBe(
    'Expected block "dialog" text to contain "Inside" but found "".'
  );
  const opened = await check({
    blocks: [openButton, modal],
    blockId: 'dialog',
    contains: 'Inside the dialog',
    steps: [{ click: 'open' }],
  });
  expect(opened.passed).toBe(true);
  const footer = await check({
    blocks: [openButton, modal],
    blockId: 'dialog',
    contains: 'Cancel',
    steps: [{ click: 'open' }],
  });
  expect(footer.passed).toBe(true);
});

test("an open Modal's text is not its parent's: antd draws it in a portal", async () => {
  const result = await check({
    blocks: [openButton, modal],
    contains: 'Inside the dialog',
    steps: [{ click: 'open' }],
  });
  expect(result.browserOnly).toBeUndefined();
  expect(result.passed).toBe(false);
});

test("a Modal's footer labels follow an app's locale, which leaves a check open", async () => {
  const result = await check({
    blocks: [openButton, modal],
    blockId: 'dialog',
    contains: 'Save',
    i18n: { locales: ['en', 'fr'] },
    steps: [{ click: 'open' }],
  });
  expect(result.browserOnly.reason).toContain(
    'Modal "dialog": its footer buttons are labelled in the app locale'
  );
});

test('a text check waits for text that a later event draws', async () => {
  const blocks = [
    {
      id: 'load',
      type: 'Button',
      properties: { title: 'Load' },
      events: {
        onClick: [
          { id: 'wait', type: 'Wait', params: 100 },
          { id: 'set', type: 'SetState', params: { loaded: '<b>Loaded</b> rows' } },
        ],
      },
    },
    { id: 'rows', type: 'Html', properties: { html: { _state: 'loaded' } } },
  ];
  const result = await check({
    blocks,
    blockId: 'rows',
    contains: 'Loaded rows',
    steps: [{ click: 'load' }],
  });
  expect(result.passed).toBe(true);
});

test('a block with no text model leaves a check it does not find to the browser, naming its type', async () => {
  const blocks = [
    { id: 'name', type: 'Html', properties: { html: 'Acme Ltd' } },
    { id: 'email', type: 'TextInput' },
    { id: 'chain', type: 'PluginChain' },
  ];
  expect((await check({ blocks, contains: 'Acme' })).passed).toBe(true);
  expect((await check({ blocks, contains: 'Beta' })).browserOnly.reason).toBe(
    'Block "home" holds blocks a headless run has no text model for (TextInput "email", PluginChain "chain"), which may show "Beta": the step runs in a browser.'
  );
});

test('a hidden block and an area its block does not draw hold no text', async () => {
  const blocks = [
    { id: 'gone', type: 'Html', visible: false, properties: { html: 'Hidden text' } },
    {
      id: 'card',
      type: 'Card',
      slots: {
        footer: { blocks: [{ id: 'unused', type: 'Html', properties: { html: 'Not drawn' } }] },
      },
    },
  ];
  expect((await check({ blocks, contains: 'Hidden text' })).passed).toBe(false);
  expect((await check({ blocks, contains: 'Not drawn' })).passed).toBe(false);
});

test("a plugin block's headlessText names the properties it draws", async () => {
  const blocks = [
    { id: 'banner', type: 'PluginBanner', properties: { title: 'Welcome', body: { text: 5 } } },
  ];
  expect((await check({ blocks, contains: 'Welcome' })).passed).toBe(true);
  expect((await check({ blocks, contains: '5' })).passed).toBe(true);
  expect((await check({ blocks, contains: 'Goodbye' })).passed).toBe(false);
  const marked = [{ id: 'banner', type: 'PluginBanner', properties: { title: '<b>Hi</b> there' } }];
  expect((await check({ blocks: marked, contains: 'Hi there' })).browserOnly.reason).toContain(
    'may show "Hi there" across its text'
  );
});

test('a plugin container leaves the text of the blocks inside it open', async () => {
  const blocks = [
    {
      id: 'panel',
      type: 'PluginPanel',
      properties: { title: 'Panel' },
      blocks: [{ id: 'inside', type: 'Html', properties: { html: 'Inside' } }],
    },
  ];
  expect((await check({ blocks, contains: 'Panel' })).passed).toBe(true);
  expect((await check({ blocks, contains: 'Inside' })).browserOnly.reason).toContain(
    'PluginPanel "panel": it draws the blocks inside it, which its headlessText does not cover'
  );
});

test('text an html enhancer writes leaves a check open', async () => {
  const blocks = [
    {
      id: 'when',
      type: 'Html',
      properties: { html: 'Updated <span data-time="2026-11-01T00:00:00Z">1 Nov</span>' },
    },
  ];
  expect((await check({ blocks, contains: 'Updated' })).passed).toBe(true);
  expect((await check({ blocks, contains: '3 weeks ago' })).browserOnly.reason).toContain(
    'an html enhancer writes some of its text'
  );
});

test('the antd text blocks draw their properties as the browser does', async () => {
  const blocks = [
    { id: 'heading', type: 'Title', properties: { content: 'Companies &amp; contacts' } },
    { id: 'save', type: 'Button' },
    { id: 'state', type: 'Tag', properties: { title: 3 } },
    {
      id: 'total',
      type: 'Statistic',
      properties: { title: 'Total', value: 1234567.891, precision: 2 },
    },
    {
      id: 'details',
      type: 'Descriptions',
      properties: { items: [{ label: 'Owner', value: 'Jo  Smith' }, 'Active'] },
    },
    {
      id: 'note',
      type: 'Alert',
      properties: { message: 'Heads up', description: 'Two rows changed' },
    },
  ];
  const passes = [
    'Companies & contacts',
    'save',
    '3',
    '1,234,567.89',
    'Total',
    'Owner',
    'Jo  Smith',
    'Active',
    'Two rows changed',
  ];
  for (const contains of passes) {
    expect([contains, (await check({ blocks, contains })).passed]).toEqual([contains, true]);
  }
  // Descriptions keep white space (pre-wrap), so a single space does not match two.
  expect((await check({ blocks, contains: 'Jo Smith' })).browserOnly.reason).toContain(
    'may show "Jo Smith" across its text'
  );
});

test('Markdown is read as react-markdown draws it', async () => {
  const blocks = [
    {
      id: 'notes',
      type: 'Markdown',
      properties: { content: '# Notes\n\n**Bold** text and `code`\n\n<b>raw</b>' },
    },
  ];
  expect((await check({ blocks, contains: 'Bold text and' })).passed).toBe(true);
  expect((await check({ blocks, contains: 'Notes' })).passed).toBe(true);
  // react-markdown shows html in markdown as text, without rehype-raw.
  expect((await check({ blocks, contains: '<b>raw</b>' })).passed).toBe(true);
  expect((await check({ blocks, contains: 'Missing' })).passed).toBe(false);
});
