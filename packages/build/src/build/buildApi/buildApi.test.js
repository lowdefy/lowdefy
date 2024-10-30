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

import { jest } from '@jest/globals';

import buildApi from './buildApi.js';
import testContext from '../../test/testContext.js';

const mockLogWarn = jest.fn();
const mockLog = jest.fn();

const logger = {
  warn: mockLogWarn,
  log: mockLog,
};

const context = testContext({ logger });

beforeEach(() => {
  mockLogWarn.mockReset();
  mockLog.mockReset();
});

test('buildApi no api', () => {
  const components = {};
  const res = buildApi({ components, context });
  expect(res.api).toBe(undefined);
});

test('buildApi api not an array', () => {
  const components = {
    api: 'api',
  };
  const res = buildApi({ components, context });
  expect(res).toEqual({
    api: 'api',
  });
});

test('endpoint does not have an id', () => {
  const components = {
    api: [
      {
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Endpoint id missing at endpoint 0.');
});

test('endpoint id is not a string', () => {
  const components = {
    api: [
      {
        id: true,
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint id is not a string at endpoint 0. Received true.'
  );
});

test('Throw on duplicate endpoint ids', () => {
  const components = {
    api: [
      {
        id: 'api_1',
        type: 'Api',
      },
      {
        id: 'api_1',
        type: 'Api',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Duplicate endpointId "api_1".');
});

test('stage does not have an id', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        stages: [
          {
            type: 'MongoDBInsertOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow('Stage id missing at endpoint "api1".');
});

test('stage id is not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        stages: [
          {
            id: true,
            type: 'MongoDBUpdateOne',
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Stage id is not a string at endpoint "api1". Received true.'
  );
});

test('api type missing', () => {
  const components = {
    api: [
      {
        id: 'api1',
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint type is not defined at "api1" on endpoint "api1".'
  );
});

test('api type not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 1,
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Endpoint type is not a string at "api1" on endpoint "api1". Received 1.'
  );
});

test('stage type not a string', () => {
  const components = {
    api: [
      {
        id: 'api1',
        type: 'Api',
        stages: [
          {
            id: 'stageId',
            type: 1,
          },
        ],
      },
    ],
  };
  expect(() => buildApi({ components, context })).toThrow(
    'Stage type is not a string at "stageId" on endpoint "api1". Received 1.'
  );
});

// test('no blocks on api', () => {
//   const components = {
//     api: [
//       {
//         id: '1',
//         type: 'Container',
//         auth,
//       },
//     ],
//   };
//   const res = buildApi({ components, context });
//   expect(res).toEqual({
//     api: [
//       {
//         id: 'api:1',
//         auth: { public: true },
//         apiId: '1',
//         blockId: '1',
//         type: 'Container',
//         requests: [],
//       },
//     ],
//   });
// });

// test('blocks not an array', () => {
//   const components = {
//     api: [
//       {
//         id: 'api1',
//         type: 'Container',
//         blocks: 'block_1',
//       },
//     ],
//   };
//   expect(() => buildApi({ components, context })).toThrow(
//     'Blocks at api1 on api api1 is not an array. Received "block_1"'
//   );
// });

// test('block not an object', () => {
//   const components = {
//     api: [
//       {
//         id: 'api1',
//         type: 'Container',
//         blocks: ['block_1'],
//       },
//     ],
//   };
//   expect(() => buildApi({ components, context })).toThrow(
//     'Expected block to be an object on api "api1". Received "block_1".'
//   );
// });

// test('nested blocks', () => {
//   const components = {
//     api: [
//       {
//         id: 'api_1',
//         type: 'Container',
//         auth,
//         blocks: [
//           {
//             id: 'block_1',
//             type: 'Container',
//             blocks: [
//               {
//                 id: 'block_2',
//                 type: 'Input',
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   };
//   const res = buildApi({ components, context });
//   expect(res).toEqual({
//     api: [
//       {
//         id: 'api:api_1',
//         auth: { public: true },
//         apiId: 'api_1',
//         blockId: 'api_1',
//         type: 'Container',
//         requests: [],
//         areas: {
//           content: {
//             blocks: [
//               {
//                 id: 'block:api_1:block_1:0',
//                 blockId: 'block_1',
//                 type: 'Container',
//                 areas: {
//                   content: {
//                     blocks: [
//                       {
//                         id: 'block:api_1:block_2:0',
//                         blockId: 'block_2',
//                         type: 'Input',
//                       },
//                     ],
//                   },
//                 },
//               },
//             ],
//           },
//         },
//       },
//     ],
//   });
// });

// describe('block areas', () => {
//   test('content area blocks is not an array', () => {
//     const components = {
//       api: [
//         {
//           id: 'api1',
//           type: 'Container',
//           auth,
//           areas: {
//             content: {
//               blocks: 'string',
//             },
//           },
//         },
//       ],
//     };
//     expect(() => buildApi({ components, context })).toThrow(
//       'Expected blocks to be an array at api1 in area content on api api1. Received "string"'
//     );
//   });

//   test('Add array if area blocks is undefined', () => {
//     const components = {
//       api: [
//         {
//           id: 'api1',
//           type: 'Container',
//           auth,
//           areas: {
//             content: {},
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:api1',
//           auth: { public: true },
//           blockId: 'api1',
//           apiId: 'api1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('content area on api ', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block1',
//                   type: 'Input',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           blockId: '1',
//           apiId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block:1:block1:0',
//                   blockId: 'block1',
//                   type: 'Input',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('does not overwrite area layout', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           areas: {
//             content: {
//               gutter: 20,
//               blocks: [
//                 {
//                   id: 'block1',
//                   type: 'Input',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           apiId: '1',
//           blockId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               gutter: 20,
//               blocks: [
//                 {
//                   id: 'block:1:block1:0',
//                   blockId: 'block1',
//                   type: 'Input',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('multiple content areas on api ', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'textInput',
//                   type: 'Input',
//                 },
//               ],
//             },
//             header: {
//               blocks: [
//                 {
//                   id: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           apiId: '1',
//           blockId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block:1:textInput:0',
//                   blockId: 'textInput',
//                   type: 'Input',
//                 },
//               ],
//             },
//             header: {
//               blocks: [
//                 {
//                   id: 'block:1:avatar:0',
//                   blockId: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('blocks array does not affect other content areas', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           blocks: [
//             {
//               id: 'textInput',
//               type: 'Input',
//             },
//           ],
//           areas: {
//             header: {
//               blocks: [
//                 {
//                   id: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           apiId: '1',
//           blockId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block:1:textInput:0',
//                   blockId: 'textInput',
//                   type: 'Input',
//                 },
//               ],
//             },
//             header: {
//               blocks: [
//                 {
//                   id: 'block:1:avatar:0',
//                   blockId: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('blocks array overwrites areas.content', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           blocks: [
//             {
//               id: 'textInput',
//               type: 'Input',
//             },
//           ],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'numberInput',
//                   type: 'Input',
//                 },
//               ],
//             },
//             header: {
//               blocks: [
//                 {
//                   id: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           apiId: '1',
//           blockId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block:1:textInput:0',
//                   blockId: 'textInput',
//                   type: 'Input',
//                 },
//               ],
//             },
//             header: {
//               blocks: [
//                 {
//                   id: 'block:1:avatar:0',
//                   blockId: 'avatar',
//                   type: 'Display',
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });

//   test('nested content areas ', () => {
//     const components = {
//       api: [
//         {
//           id: '1',
//           type: 'Container',
//           auth,
//           blocks: [
//             {
//               id: 'card',
//               type: 'Container',
//               areas: {
//                 content: {
//                   blocks: [
//                     {
//                       id: 'card2',
//                       type: 'Container',
//                       blocks: [
//                         {
//                           id: 'textInput',
//                           type: 'Input',
//                         },
//                       ],
//                       areas: {
//                         title: {
//                           blocks: [
//                             {
//                               id: 'title',
//                               type: 'Display',
//                             },
//                           ],
//                         },
//                       },
//                     },
//                   ],
//                 },
//                 header: {
//                   blocks: [
//                     {
//                       id: 'avatar',
//                       type: 'Display',
//                     },
//                   ],
//                 },
//               },
//             },
//           ],
//         },
//       ],
//     };
//     const res = buildApi({ components, context });
//     expect(res).toEqual({
//       api: [
//         {
//           id: 'api:1',
//           auth: { public: true },
//           apiId: '1',
//           blockId: '1',
//           type: 'Container',
//           requests: [],
//           areas: {
//             content: {
//               blocks: [
//                 {
//                   id: 'block:1:card:0',
//                   blockId: 'card',
//                   type: 'Container',
//                   areas: {
//                     content: {
//                       blocks: [
//                         {
//                           id: 'block:1:card2:0',
//                           blockId: 'card2',
//                           type: 'Container',
//                           areas: {
//                             title: {
//                               blocks: [
//                                 {
//                                   id: 'block:1:title:0',
//                                   blockId: 'title',
//                                   type: 'Display',
//                                 },
//                               ],
//                             },
//                             content: {
//                               blocks: [
//                                 {
//                                   id: 'block:1:textInput:0',
//                                   blockId: 'textInput',
//                                   type: 'Input',
//                                 },
//                               ],
//                             },
//                           },
//                         },
//                       ],
//                     },
//                     header: {
//                       blocks: [
//                         {
//                           id: 'block:1:avatar:0',
//                           blockId: 'avatar',
//                           type: 'Display',
//                         },
//                       ],
//                     },
//                   },
//                 },
//               ],
//             },
//           },
//         },
//       ],
//     });
//   });
// });

// test('user defined skeleton', () => {
//   const components = {
//     api: [
//       {
//         id: 'api_1',
//         type: 'Container',
//         auth,
//         skeleton: [
//           {
//             custom: true,
//           },
//         ],
//         blocks: [
//           {
//             id: 'block_1',
//             type: 'Input',
//             skeleton: [
//               {
//                 custom: true,
//               },
//             ],
//           },
//         ],
//       },
//     ],
//   };
//   const res = buildApi({ components, context });
//   expect(res).toEqual({
//     api: [
//       {
//         id: 'api:api_1',
//         auth: { public: true },
//         apiId: 'api_1',
//         blockId: 'api_1',
//         type: 'Container',
//         skeleton: [
//           {
//             custom: true,
//           },
//         ],
//         requests: [],
//         areas: {
//           content: {
//             blocks: [
//               {
//                 id: 'block:api_1:block_1:0',
//                 blockId: 'block_1',
//                 type: 'Input',
//                 skeleton: [
//                   {
//                     custom: true,
//                   },
//                 ],
//               },
//             ],
//           },
//         },
//       },
//     ],
//   });
// });

// test('create unique block ids', () => {
//   const components = {
//     api: [
//       {
//         id: 'api_1',
//         type: 'Container',
//         auth,
//         blocks: [
//           {
//             id: 'block',
//             type: 'Display',
//           },
//           {
//             id: 'block',
//             type: 'Display',
//           },
//           {
//             id: 'block',
//             type: 'Display',
//           },
//         ],
//       },
//     ],
//   };
//   const res = buildApi({ components, context });
//   expect(res).toEqual({
//     api: [
//       {
//         id: 'api:api_1',
//         auth: { public: true },
//         apiId: 'api_1',
//         blockId: 'api_1',
//         type: 'Container',
//         requests: [],
//         areas: {
//           content: {
//             blocks: [
//               {
//                 id: 'block:api_1:block:0',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//               {
//                 id: 'block:api_1:block:1',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//               {
//                 id: 'block:api_1:block:2',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//             ],
//           },
//         },
//       },
//     ],
//   });
// });

// test('different blockId counter for each api', () => {
//   const components = {
//     api: [
//       {
//         id: 'api_1',
//         type: 'Container',
//         auth,
//         blocks: [
//           {
//             id: 'block',
//             type: 'Display',
//           },
//           {
//             id: 'block',
//             type: 'Display',
//           },
//         ],
//       },
//       {
//         id: 'api_2',
//         type: 'Container',
//         auth,
//         blocks: [
//           {
//             id: 'block',
//             type: 'Display',
//           },
//           {
//             id: 'block',
//             type: 'Display',
//           },
//         ],
//       },
//     ],
//   };
//   const res = buildApi({ components, context });
//   expect(res).toEqual({
//     api: [
//       {
//         id: 'api:api_1',
//         auth: { public: true },
//         apiId: 'api_1',
//         blockId: 'api_1',
//         type: 'Container',
//         requests: [],
//         areas: {
//           content: {
//             blocks: [
//               {
//                 id: 'block:api_1:block:0',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//               {
//                 id: 'block:api_1:block:1',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//             ],
//           },
//         },
//       },
//       {
//         id: 'api:api_2',
//         auth: { public: true },
//         apiId: 'api_2',
//         blockId: 'api_2',
//         type: 'Container',
//         requests: [],
//         areas: {
//           content: {
//             blocks: [
//               {
//                 id: 'block:api_2:block:0',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//               {
//                 id: 'block:api_2:block:1',
//                 blockId: 'block',
//                 type: 'Display',
//               },
//             ],
//           },
//         },
//       },
//     ],
//   });
// });
