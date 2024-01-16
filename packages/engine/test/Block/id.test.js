/*
  Copyright 2020-2024 Lowdefy, Inc

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

test('array block with init, set to id', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    events: {
      onInit: [
        {
          id: 'initState',
          type: 'SetState',
          params: { list: [{ text: 'b' }] },
        },
      ],
    },
    blocks: [
      {
        type: 'List',
        id: 'list',
        blocks: [
          {
            type: 'TextInput',
            id: 'list.$.text',
            field: 'field.$.text',
          },
        ],
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  expect(context.state).toEqual({ list: [{ text: 'b' }] });
  const list_text = context._internal.RootBlocks.map['list.0.text'];
  expect(list_text.value).toEqual('b');
});

test('two blocks with same id should have the same value', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        type: 'Switch',
        id: 'swtch1',
      },
      {
        type: 'Switch',
        id: 'swtch1',
      },
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const swtch1 = context._internal.RootBlocks.subBlocks['page:root'][0].areas.content.blocks[0];
  const swtch2 = context._internal.RootBlocks.subBlocks['page:root'][0].areas.content.blocks[1];
  expect(swtch1.value).toBe(false);
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ swtch1: false });

  swtch1.setValue(true);
  expect(swtch1.value).toBe(true);
  expect(swtch2.value).toBe(true);
  expect(context.state).toEqual({ swtch1: true });

  swtch2.setValue(false);
  expect(swtch1.value).toBe(false);
  expect(swtch2.value).toBe(false);
  expect(context.state).toEqual({ swtch1: false });
});

// TODO:
// test('two blocks with same field visibility and state', async () => {
//   const pageConfig = {
//     id: 'root',
//     type: 'Box',
//     events: {
//       onInit: [
//         {
//           id: 'initState',
//           type: 'SetState',
//           params: { field: 'field', swtch2: true, swtch1: true },
//         },
//       ],
//     },
//     blocks: [
//       {
//         type: 'TextInput',
//         id: 'text',
//         visible: { _state: 'swtch' },
//       },
//       {
//         type: 'TextInput',
//         id: 'text',
//         visible: { _state: 'swtch' },
//       },
//       {
//         type: 'Switch',
//         id: 'swtch',
//       },
//       {
//         type: 'Switch',
//         id: 'swtch',
//       },
//     ],
//   };
//   const context = await testContext({
//     lowdefy,
//     pageConfig,
//   });
//   const { swtch1, swtch2, text1, text2 } = context._internal.RootBlocks.map;

//   expect(text1.visibleEval.output).toBe(true);
//   expect(text2.visibleEval.output).toBe(true);
//   expect(context.state).toEqual({ field: 'field', swtch1: true, swtch2: true });

//   swtch1.setValue(false);
//   expect(text1.visibleEval.output).toBe(false);
//   expect(text2.visibleEval.output).toBe(true);
//   expect(context.state).toEqual({ field: 'field', swtch1: false, swtch2: true });

//   text2.setValue('new');
//   expect(text1.value).toEqual('new');
//   expect(text2.value).toEqual('new');
//   expect(context.state).toEqual({ field: 'new', swtch1: false, swtch2: true });

//   swtch2.setValue(false);
//   expect(text1.visibleEval.output).toBe(false);
//   expect(text2.visibleEval.output).toBe(false);
//   expect(text1.value).toEqual('new');
//   expect(text2.value).toEqual('new');
//   expect(context.state).toEqual({ swtch1: false, swtch2: false });

//   swtch1.setValue(true);
//   expect(text1.visibleEval.output).toBe(true);
//   expect(text2.visibleEval.output).toBe(false);
//   expect(context.state).toEqual({ field: 'new', swtch1: true, swtch2: false });
// });
