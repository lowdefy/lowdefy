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

import testContext from '../testContext.js';

const pageId = 'one';
const lowdefy = { pageId, _internal: {} };

// contact.extra, contact.items (a list) and contactx.extra show only while show_extra is on.
// contact.name is always visible. The button runs SetState with the params a test passes.
async function hiddenFormContext(params) {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'init',
          type: 'SetState',
          params: {
            show_extra: true,
            contact: { name: 'Ann', extra: 'abc', items: [{ label: 'one' }, { label: 'two' }] },
            contactx: { extra: 'xyz' },
          },
        },
      ],
    },
    blocks: [
      { id: 'show_extra', type: 'Switch' },
      { id: 'contact.name', type: 'TextInput' },
      { id: 'contact.extra', type: 'TextInput', visible: { _state: 'show_extra' } },
      {
        id: 'contact.items',
        type: 'List',
        visible: { _state: 'show_extra' },
        blocks: [{ id: 'contact.items.$.label', type: 'TextInput' }],
      },
      { id: 'contactx.extra', type: 'TextInput', visible: { _state: 'show_extra' } },
      {
        id: 'button',
        type: 'Button',
        events: { onClick: [{ id: 'setState', type: 'SetState', params }] },
      },
    ],
  };
  const context = await testContext({ lowdefy, pageConfig });
  const { map } = context._internal.RootSlots;
  map.show_extra.setValue(false);
  expect(context.state).toEqual({ show_extra: false, contact: { name: 'Ann' } });
  await map.button.triggerEvent({ name: 'onClick' });
  map.show_extra.setValue(true);
  return context;
}

test('SetState of a parent to {} clears hidden inputs below it', async () => {
  const context = await hiddenFormContext({ contact: {} });
  expect(context.state).toEqual({
    show_extra: true,
    contact: { name: null, extra: null, items: [] },
    contactx: { extra: 'xyz' },
  });
  expect(context._internal.RootSlots.map['contact.items.0.label']).toBeUndefined();
});

test('SetState of a parent to null clears hidden inputs below it', async () => {
  const context = await hiddenFormContext({ contact: null });
  expect(context.state).toEqual({
    show_extra: true,
    contact: { name: null, extra: null, items: [] },
    contactx: { extra: 'xyz' },
  });
  expect(context._internal.RootSlots.map['contact.items.0.label']).toBeUndefined();
});

test('SetState of a hidden input path to null clears it', async () => {
  const context = await hiddenFormContext({ 'contact.extra': null });
  expect(context.state).toEqual({
    show_extra: true,
    contact: { name: 'Ann', extra: null, items: [{ label: 'one' }, { label: 'two' }] },
    contactx: { extra: 'xyz' },
  });
});

test('SetState of a hidden list path to [] clears its rows', async () => {
  const context = await hiddenFormContext({ 'contact.items': [] });
  expect(context.state).toEqual({
    show_extra: true,
    contact: { name: 'Ann', extra: 'abc', items: [] },
    contactx: { extra: 'xyz' },
  });
  expect(context._internal.RootSlots.map['contact.items.0.label']).toBeUndefined();
});

test('SetState of a sibling with a shared prefix keeps hidden inputs', async () => {
  const context = await hiddenFormContext({ contactx: {} });
  expect(context.state).toEqual({
    show_extra: true,
    contact: { name: 'Ann', extra: 'abc', items: [{ label: 'one' }, { label: 'two' }] },
    contactx: { extra: null },
  });
});

test('SetState of an unrelated path keeps hidden inputs', async () => {
  const context = await hiddenFormContext({ other: 1 });
  expect(context.state).toEqual({
    show_extra: true,
    other: 1,
    contact: { name: 'Ann', extra: 'abc', items: [{ label: 'one' }, { label: 'two' }] },
    contactx: { extra: 'xyz' },
  });
});
