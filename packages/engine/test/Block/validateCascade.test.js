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

import { vi, beforeEach, expect, test } from 'vitest';

import testContext from '../testContext.js';

const warn = vi.fn();
const lowdefy = {
  pageId: 'one',
  _internal: {
    actions: {
      ResetValidation: ({ methods: { resetValidation }, params }) => resetValidation(params),
      Validate: ({ methods: { validate }, params }) => validate(params),
    },
    logger: { error: () => {}, warn, log: () => {}, debug: () => {} },
    blocks: { Table: {} },
    blockMetas: { Table: { category: 'input-container', valueType: 'object' } },
  },
};

// Comment out to use console
console.log = () => {};
console.error = () => {};

beforeEach(() => {
  warn.mockReset();
});

const button = ({ id, actions }) => ({
  id,
  type: 'Button',
  events: { onClick: actions },
});

const validateThenSave = (params) => [
  { id: 'validate', type: 'Validate', params },
  { id: 'save', type: 'SetState', params: { saved: true } },
];

const contactPage = (params) => ({
  id: 'root',
  type: 'Box',
  blocks: [
    {
      id: 'contact_card',
      type: 'Box',
      blocks: [{ id: 'contact.name', type: 'TextInput', required: true }],
    },
    { id: 'other', type: 'TextInput', required: true },
    button({ id: 'save_button', actions: validateThenSave(params) }),
    button({
      id: 'reset_button',
      actions: [{ id: 'reset', type: 'ResetValidation', params: 'contact_card' }],
    }),
  ],
});

const click = async (context, id) => {
  const block = context._internal.RootSlots.map[id];
  await block.triggerEvent({ name: 'onClick' });
  return block.Events.events.onClick.history[0];
};

test('Validate on a container validates the inputs inside it and stops the chain', async () => {
  const context = await testContext({ lowdefy, pageConfig: contactPage('contact_card') });
  const history = await click(context, 'save_button');
  const { other } = context._internal.RootSlots.map;
  const name = context._internal.RootSlots.map['contact.name'];
  expect(history.success).toBe(false);
  expect(history.error.error.invalidBlocks).toEqual(['contact.name']);
  expect(context.state.saved).toBeUndefined();
  expect(name.eval.validation).toEqual({
    errors: ['This field is required'],
    status: 'error',
    warnings: [],
  });
  expect(other.eval.validation.status).toBe(null);
  expect(warn).not.toHaveBeenCalled();
});

test('ResetValidation on a container clears the inputs inside it', async () => {
  const context = await testContext({ lowdefy, pageConfig: contactPage('contact_card') });
  const name = context._internal.RootSlots.map['contact.name'];
  await click(context, 'save_button');
  expect(name.showValidation).toBe(true);
  expect(name.eval.validation.status).toBe('error');
  await click(context, 'reset_button');
  expect(name.showValidation).toBe(false);
  expect(name.eval.validation.status).toBe(null);
  expect(warn).not.toHaveBeenCalled();
});

test('Validate on an input id validates only that input', async () => {
  const context = await testContext({ lowdefy, pageConfig: contactPage('other') });
  const history = await click(context, 'save_button');
  expect(history.error.error.invalidBlocks).toEqual(['other']);
  expect(context._internal.RootSlots.map['contact.name'].eval.validation.status).toBe(null);
});

test('Validate on a container in a container validates the inputs inside both', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'outer',
        type: 'Box',
        blocks: [
          { id: 'a', type: 'TextInput', required: true },
          {
            id: 'inner',
            type: 'Box',
            blocks: [{ id: 'b', type: 'TextInput', required: true }],
          },
        ],
      },
      { id: 'c', type: 'TextInput', required: true },
      button({ id: 'save_button', actions: validateThenSave('outer') }),
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'save_button');
  expect(history.error.error.invalidBlocks).toEqual(['a', 'b']);
  expect(context.state.saved).toBeUndefined();
});

test('Validate on an input-container validates it and the inputs in its slots', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'table',
        type: 'Table',
        required: true,
        slots: {
          bulkActions: { blocks: [{ id: 'note', type: 'TextInput', required: true }] },
        },
      },
      button({ id: 'save_button', actions: validateThenSave('table') }),
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'save_button');
  expect(history.error.error.invalidBlocks).toEqual(['table', 'note']);
});

test('Validate on a container validates every row of a list inside it', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [{ id: 'init', type: 'SetState', params: { items: [{ name: 'x' }, {}, {}] } }],
    },
    blocks: [
      {
        id: 'form',
        type: 'Box',
        blocks: [
          {
            id: 'items',
            type: 'List',
            blocks: [{ id: 'items.$.name', type: 'TextInput', required: true }],
          },
        ],
      },
      button({ id: 'save_button', actions: validateThenSave('form') }),
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'save_button');
  expect(history.error.error.invalidBlocks).toEqual(['items.1.name', 'items.2.name']);
});

test('Validate with an id that matches no block warns once and succeeds', async () => {
  const context = await testContext({ lowdefy, pageConfig: contactPage(['contact_crad']) });
  const history = await click(context, 'save_button');
  expect(history.success).toBe(true);
  expect(context.state.saved).toBe(true);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('"contact_crad"');
});

test('ResetValidation with an id that matches no block warns', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      button({
        id: 'reset_button',
        actions: [{ id: 'reset', type: 'ResetValidation', params: { blockIds: 'nope' } }],
      }),
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'reset_button');
  expect(history.success).toBe(true);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('"nope"');
});

test.each([
  ['no params', undefined],
  ['blockIds: true', { blockIds: true }],
  ['a regex that matches nothing', { regex: '^nothing$' }],
  ['a list-row $ id with no row', 'items.$.name'],
])('Validate with %s does not warn', async (_, params) => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'items',
        type: 'List',
        blocks: [{ id: 'items.$.name', type: 'TextInput' }],
      },
      button({ id: 'save_button', actions: validateThenSave(params) }),
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'save_button');
  expect(history.success).toBe(true);
  expect(warn).not.toHaveBeenCalled();
});

test('Validate in a list row with a $ id that matches no block in the row warns', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [{ id: 'init', type: 'SetState', params: { items: [{ name: 'x' }] } }],
    },
    blocks: [
      {
        id: 'items',
        type: 'List',
        blocks: [
          { id: 'items.$.name', type: 'TextInput' },
          button({ id: 'items.$.save', actions: validateThenSave('items.$.nmae') }),
        ],
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const history = await click(context, 'items.0.save');
  expect(history.success).toBe(true);
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('"items.0.nmae"');
});

test('Validate with a repeated unmatched id warns once', async () => {
  const context = await testContext({ lowdefy, pageConfig: contactPage(['nope', 'nope']) });
  await click(context, 'save_button');
  expect(warn).toHaveBeenCalledTimes(1);
});
