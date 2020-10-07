/* eslint-disable dot-notation */
import testContext from '../testContext';

const NUM_TIMES = 10;
const branch = 'master';
const pageId = 'one';
const client = { writeFragment: jest.fn() };

const rootContext = {
  branch,
  client,
  window,
};

// eslint-disable-next-line consistent-return
const runTests = ({ times, results = [], fn }) => {
  if (times <= 0) {
    return results;
  }
  try {
    // eslint-disable-next-line no-undef
    const start = performance.now();
    fn(times);
    // eslint-disable-next-line no-undef
    const end = performance.now();
    const duration = end - start;

    return runTests({
      times: times - 1,
      results: results.concat([duration]),
      fn,
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

test(`parse nunjucks value 500 blocks`, () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: `b0`,
            type: 'TextInput',
            properties: {
              test: '1',
            },
            defaultValue: 'b_0',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          ...Array(...Array(500)).map((_, i) => ({
            blockId: `b_${i + 1}`,
            type: 'TextInput',
            properties: {
              test: { _nunjucks: `{{ b_${i} }}` },
            },
            defaultValue: `b_${i + 1}`,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          })),
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { b0 } = context.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(i);
    context.update();
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log(`parse nunjucks value 1000 blocks`);
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(501);
});

test(`parse nunjucks value 100 blocks`, () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: `b0`,
            type: 'TextInput',
            properties: {
              test: '1',
            },
            defaultValue: 'b_0',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          ...Array(...Array(100)).map((_, i) => ({
            blockId: `b_${i + 1}`,
            type: 'TextInput',
            properties: {
              test: { _nunjucks: `{{ b_${i} }}` },
            },
            defaultValue: `b_${i + 1}`,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          })),
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { b0 } = context.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(i);
    context.update();
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log(`parse nunjucks value 100 blocks`);
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(101);
});

test(`parse state value 1000 blocks`, () => {
  const rootBlock = {
    blockId: 'root',
    meta: {
      category: 'context',
    },
    areas: {
      content: {
        blocks: [
          {
            blockId: `b0`,
            type: 'TextInput',
            properties: {
              test: '1',
            },
            defaultValue: 'b_0',
            meta: {
              category: 'input',
              valueType: 'string',
            },
          },
          ...Array(...Array(1000)).map((_, i) => ({
            blockId: `b_${i + 1}`,
            type: 'TextInput',
            properties: {
              test: { _state: `b_${i}` },
            },
            defaultValue: `b_${i + 1}`,
            meta: {
              category: 'input',
              valueType: 'string',
            },
          })),
        ],
      },
    },
  };
  const context = testContext({
    rootContext,
    rootBlock,
    pageId,
  });
  const { b0 } = context.RootBlocks.map;

  const fn = (i) => {
    b0.setValue(`${i}`);
  };
  const results = runTests({ times: NUM_TIMES, fn });
  const totalTime = results.reduce((sum, r) => sum + r, 0);
  const average = (totalTime / NUM_TIMES).toFixed(3);
  const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
  const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
  console.log(`parse state value 1000 blocks`);
  console.log(`Average: ${average}ms`);
  console.log(`Max: ${max}ms`);
  console.log(`Min: ${min}ms`);
  expect(Object.keys(context.state).length).toEqual(1001);
});

// test.only(`parse state value 10 blocks`, () => {
//   const rootBlock = {
//     blockId: 'root',
//     meta: {
//       category: 'context',
//     },
//     areas: { content: { blocks: [
//       {
//         blockId: `b_0`,
//         type: 'TextInput',
//         properties: {
//           test: '1',
//         },
//         defaultValue: 'b_0',
//         meta: {
//           category: 'input',
//           valueType: 'string',
//         },
//       },
//       ...Array(...Array(9)).map((_, i) => ({
//         blockId: `b_${i + 1}`,
//         type: 'TextInput',
//         properties: {
//           test: { _state: `b_${i}` },
//         },
//         defaultValue: `b_${i + 1}`,
//         meta: {
//           category: 'input',
//           valueType: 'string',
//         },
//       })),
//     ],}}
//   };
//   const context = testContext({
//     rootContext,
//     rootBlock,
//     pageId,
//   });
//   const b0 = context.RootBlocks.subBlocks[context.RootBlocks.blocks[0].id][0].blocks[0];

//   const fn = (i) => {
//     console.log('-----------------------');
//     console.log(`fn: ${i}`);
//     b0.setValue(i);
//     context.update();
//   };
//   const results = runTests({ times: 3, fn });
//   // const totalTime = results.reduce((sum, r) => sum + r, 0);
//   // const average = (totalTime / 3).toFixed(3);
//   // const max = results.reduce((maxS, r) => (r > maxS ? r : maxS), 0);
//   // const min = results.reduce((minS, r) => (r < minS ? r : minS), Infinity);
//   // console.log(`parse state value 10 blocks`);
//   // console.log(`Average: ${average}ms`);
//   // console.log(`Max: ${max}ms`);
//   // console.log(`Min: ${min}ms`);
//   expect(Object.keys(context.state).length).toEqual(10);
// });

// test(`parse state value 1000 array items with rec loop of visible`, () => {
//   const blocks = [
//     {
//       type: 'TextInput',
//       blockId: 'a',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     },
//     {
//       blockId: `b_0`,
//       type: 'TextInput',
//       visible: { _state: 'a' },
//       defaultValue: 'y',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     },
//     ...Array(...Array(43)).map((_, i) => ({
//       blockId: `b_${i + 1}`,
//       type: 'TextInput',
//       visible: { _state: `b_${i}` },
//       defaultValue: 'y',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     })),
//     // {
//     //   type: 'list',
//     //   blockId: 'list',
//     //   meta: {
//     //     category: 'list',
//     //     valueType: 'array',
//     //   },
//     //   areas: { content: { blocks: [
//     //     {
//     //       blockId: `list.$.b0`,
//     //       type: 'TextInput',
//     //       visible: { _state: 'a' },
//     //       defaultValue: 'y',
//     //       meta: {
//     //         category: 'input',
//     //         valueType: 'string',
//     //       },
//     //     },
//     //     ...Array(...Array(100)).map((_, i) => ({
//     //       blockId: `list.$.b${i + 1}`,
//     //       type: 'TextInput',
//     //       visible: { _state: `list.$.b${i}` },
//     //       defaultValue: 'y',
//     //       meta: {
//     //         category: 'input',
//     //         valueType: 'string',
//     //       },
//     //     })),
//     //   ],}}
//     // },
//   ];
//   context.State.state = {};
//   context.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context.RootBlocks.init();
//   context.RootBlocks.update();
//   // context.RootBlocks.blocks[1].pushItem();
//   context.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state.list[0]).length).toEqual(80);
// });

// test(`parse state value 100 blocks`, () => {
//   const blocks = [
//     {
//       blockId: `b_0`,
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//       defaultValue: 'b_0',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     },
//     ...Array(...Array(100)).map((_, i) => ({
//       blockId: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _state: `b_${i}` },
//       },
//       defaultValue: `b_${i + 1}`,
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     })),
//   ];
//   context.State.state = {};
//   context.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context.RootBlocks.init();
//   context.RootBlocks.update();
//   context.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(101);
// });

// test(`parse state value 1000 blocks`, () => {
//   const blocks = [
//     {
//       blockId: `b_0`,
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//       defaultValue: 'b_0',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     },
//     ...Array(...Array(1000)).map((_, i) => ({
//       blockId: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _state: `b_${i}` },
//       },
//       defaultValue: `b_${i + 1}`,
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     })),
//   ];
//   context.State.state = {};
//   context.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context.RootBlocks.init();
//   context.RootBlocks.update();
//   context.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(1001);
// });

// test(`parse nunjucks value 100 blocks`, () => {
//   const blocks = [
//     {
//       blockId: `b_0`,
//       type: 'TextInput',
//       properties: {
//         test: '1',
//       },
//       defaultValue: 'b_0',
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     },
//     ...Array(...Array(100)).map((_, i) => ({
//       blockId: `b_${i + 1}`,
//       type: 'TextInput',
//       properties: {
//         test: { _nunjucks: `{{ b_${i} }}` },
//       },
//       defaultValue: `b_${i + 1}`,
//       meta: {
//         category: 'input',
//         valueType: 'string',
//       },
//     })),
//   ];
//   context.State.state = {};
//   context.RootBlocks = new Blocks({
//     blocks,
//     context,
//     arrayIndices: [],
//   });
//   context.RootBlocks.init();
//   context.RootBlocks.update();
//   context.RootBlocks.blocks[0].setValue('x');
//   expect(Object.keys(context.State.state).length).toEqual(101);
// });
