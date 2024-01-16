/* eslint-disable dot-notation */

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

const NUM_TIMES = 10;
const pageId = 'one';
const lowdefy = { pageId };

// eslint-disable-next-line consistent-return
const runTests = ({ times, results = [], fn }) => {
  if (times <= 0) {
    return results;
  }
  // eslint-disable-next-line no-undef
  const start = Date.now();
  fn(times);
  // eslint-disable-next-line no-undef
  const end = Date.now();
  const duration = end - start;

  return runTests({
    times: times - 1,
    results: results.concat([duration]),
    fn,
  });
};

test('parse nunjucks value 500 blocks', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'b0',
        type: 'TextInput',
        properties: {
          test: '1',
        },
      },
      ...Array(...Array(500)).map((_, i) => ({
        id: `b_${i + 1}`,
        type: 'TextInput',
        properties: {
          test: { _nunjucks: `{{ b_${i} }}` },
        },
      })),
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { b0 } = context._internal.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(i);
    context._internal.update();
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log('parse nunjucks value 1000 blocks');
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(501);
});

test('parse nunjucks value 100 blocks', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'b0',
        type: 'TextInput',
        properties: {
          test: '1',
        },
      },
      ...Array(...Array(100)).map((_, i) => ({
        id: `b_${i + 1}`,
        type: 'TextInput',
        properties: {
          test: { _nunjucks: `{{ b_${i} }}` },
        },
      })),
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { b0 } = context._internal.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(i);
    context._internal.update();
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log('parse nunjucks value 100 blocks');
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(101);
});

test('parse state value 1000 blocks', async () => {
  const pageConfig = {
    id: 'root',
    type: 'Box',
    blocks: [
      {
        id: 'b0',
        type: 'TextInput',
        properties: {
          test: '1',
        },
      },
      ...Array(...Array(1000)).map((_, i) => ({
        id: `b_${i + 1}`,
        type: 'TextInput',
        properties: {
          test: { _state: `b_${i}` },
        },
      })),
    ],
  };
  const context = await testContext({
    lowdefy,
    pageConfig,
  });
  const { b0 } = context._internal.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(`${i}`);
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log('parse state value 1000 blocks');
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(1001);
});

// test.only('parse state value 10 blocks', async () => {
//   const pageConfig = {
//     id: 'root',
//     type: 'Box',
//     areas: { content: { blocks: [
//       {
//         id: 'b_0',
//         type: 'TextInput',
//         properties: {
//           test: '1',
//         },
//       },
//       ...Array(...Array(9)).map((_, i) => ({
//         id: `b_${i + 1}`,
//         type: 'TextInput',
//         properties: {
//           test: { _state: `b_${i}` },
//         },
//       })),
//     ],}}
//   };
//   const context = await testContext({
//     rootContext,
//     pageConfig,
//     pageId,
//   });
//   const b0 = context._internal.RootBlocks.subBlocks[context._internal.RootBlocks.blocks[0].id][0].blocks[0];

//   const fn = (i) => {
//     console.log('-----------------------');
//     console.log(`fn: ${i}`);
//     b0.setValue(i);
//     context._internal.update();
//   };
//   const results = runTests({ times: 3, fn });
//   // const totalTime = results.reduce((sum, r) => sum + r, 0);
//   // const average = (totalTime / 3).toFixed(3);
//   // const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
//   // const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
//   // console.log('parse state value 10 blocks');
//   // console.log(`Average: ${average}ms`);
//   // console.log(`Max: ${max}ms`);
//   // console.log(`Min: ${min}ms`);
//   expect(Object.keys(context.state).length).toEqual(10);
// });

// test('parse state value 1000 array items with rec loop of visible', async () => {
//   const blocks = [
//     {
//       type: 'TextInput',
//       id: 'a',
//     },
//     {
//       id: 'b_0',
//       type: 'TextInput',
//       visible: { _state: 'a' },
//     },
//     ...Array(...Array(43)).map((_, i) => ({
//       id: `b_${i + 1}`,
//       type: 'TextInput',
//       visible: { _state: `b_${i}` },
//     })),
//     // {
//     //   type: 'List',
//     //   id: 'list',
//     //   areas: { content: { blocks: [
//     //     {
//     //       id: `list.$.b0`,
//     //       type: 'TextInput',
//     //       visible: { _state: 'a' },
//     //     },
//     //     ...Array(...Array(100)).map((_, i) => ({
//     //       id: `list.$.b${i + 1}`,
//     //       type: 'TextInput',
//     //       visible: { _state: `list.$.b${i}` },
//     //     })),
//     //   ],}}
//     // },
//   ];
//   context.State.state = {};
//   context._internal.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context._internal.RootBlocks.init();
//   context._internal.RootBlocks.update();
//   // context._internal.RootBlocks.blocks[1].pushItem();
//   context._internal.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state.list[0]).length).toEqual(80);
// });

// test('parse state value 100 blocks', async () => {
//   const blocks = [
//     {
//       id: 'b_0',
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//     },
//     ...Array(...Array(100)).map((_, i) => ({
//       id: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _state: `b_${i}` },
//       },
//     })),
//   ];
//   context.State.state = {};
//   context._internal.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context._internal.RootBlocks.init();
//   context._internal.RootBlocks.update();
//   context._internal.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(101);
// });

// test('parse state value 1000 blocks', () => {
//   const blocks = [
//     {
//       id: 'b_0',
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//     },
//     ...Array(...Array(1000)).map((_, i) => ({
//       id: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _state: `b_${i}` },
//       },
//     })),
//   ];
//   context.State.state = {};
//   context._internal.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context._internal.RootBlocks.init();
//   context._internal.RootBlocks.update();
//   context._internal.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(1001);
// });

// test('parse nunjucks value 100 blocks', async () => {
//   const blocks = [
//     {
//       id: 'b_0',
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//     },
//     ...Array(...Array(100)).map((_, i) => ({
//       id: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _nunjucks: `{{ b_${i} }}` },
//       },
//     })),
//   ];
//   context.State.state = {};
//   context._internal.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context._internal.RootBlocks.init();
//   context._internal.RootBlocks.update();
//   context._internal.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(101);
// });
