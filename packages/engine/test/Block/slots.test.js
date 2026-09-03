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
const lowdefy = { pageId };

test('two slots in block', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    slots: {
      key1: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch1',
          },
        ],
      },
      key2: {
        blocks: [
          {
            type: 'Switch',
            id: 'swtch2',
          },
        ],
      },
    },
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { swtch1, swtch2 } = context._internal.RootSlots.map;
  expect(swtch1.value).toBe(false);
  expect(context.state).toEqual({ swtch1: false, swtch2: false });
  swtch1.setValue(true);
  expect(swtch1.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ swtch1: true, swtch2: false });
  swtch2.setValue(true);
  expect(swtch2.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true, swtch2: true });
});

test('slots inside list', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'List',
        id: 'list',
        slots: {
          key1: {
            blocks: [
              {
                type: 'Switch',
                id: 'list.$.swtchB',
              },
            ],
          },
          key2: {
            blocks: [
              {
                type: 'Switch',
                id: 'list.$.swtchA',
              },
            ],
          },
        },
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { list } = context._internal.RootSlots.map;

  list.pushItem();
  const swtchA0 = context._internal.RootSlots.map['list.0.swtchA'];
  const swtchB0 = context._internal.RootSlots.map['list.0.swtchB'];
  expect(swtchA0.value).toBe(false);
  expect(swtchB0.value).toBe(false);

  swtchA0.setValue(true);
  expect(context.state).toEqual({ list: [{ swtchA: true, swtchB: false }] });

  list.pushItem();
  const swtchA1 = context._internal.RootSlots.map['list.1.swtchA'];
  const swtchB1 = context._internal.RootSlots.map['list.1.swtchB'];

  expect(swtchA1.value).toBe(false);
  expect(swtchB1.value).toBe(false);
  swtchB1.setValue(true);
  expect(context.state).toEqual({
    list: [
      { swtchA: true, swtchB: false },
      { swtchA: false, swtchB: true },
    ],
  });
});
