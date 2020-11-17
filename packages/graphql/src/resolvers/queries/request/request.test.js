/*
  Copyright 2020 Lowdefy, Inc

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

// import { gql } from 'apollo-server';
// import runTestQuery from '../../../test/runTestQuery';
import request from './request';

const mockCallRequest = jest.fn(
  ({
    args,
    arrayIndices,
    contextId,
    input,
    lowdefyGlobal,
    pageId,
    requestId,
    state,
    urlQuery,
  }) => ({
    id: 'requestId',
    success: true,
    type: 'RequestType',
    response: {
      args,
      arrayIndices,
      contextId,
      input,
      lowdefyGlobal,
      pageId,
      requestId,
      state,
      urlQuery,
    },
  })
);

const getController = jest.fn(() => ({
  callRequest: mockCallRequest,
}));

// const mockLoadComponent = jest.fn((id) => {
//   if (id === 'page:branch:pageId') {
//     return {
//       id: 'page:branch:pageId',
//       jsonString:
//         '{"id":"page:branch:pageId","blockId":"blockId","public":true,"pageId":"pageId","requests":[{"id":"request:branch:pageId:requestId","requestId":"requestId"}]}',
//     };
//   }
//   if (id === 'request:branch:pageId:blockId:requestId') {
//     return {
//       id: 'request:branch:pageId:requestId',
//       type: 'AxiosHttp',
//       connectionId: 'connectionId',
//       properties: {
//         params: {
//           test: 'test',
//         },
//       },
//     };
//   }
//   if (id === 'connection:branch:connectionId') {
//     return {
//       id: 'connection:branch:connectionId',
//       type: 'AxiosHttp',
//       properties: {
//         url: 'https://postman-echo.com/get',
//       },
//     };
//   }
//   if (id === 'lowdefy:branch:config') {
//     return {
//       id: 'lowdefy:branch:config',
//       settings: {},
//     };
//   }
//   if (id === 'lowdefy:branch:global') {
//     return {
//       id: 'lowdefy:branch:global',
//       settings: {},
//     };
//   }
//   return null;
// });

// const loaders = {
//   component: {
//     load: mockLoadComponent,
//   },
// };

// const CONNECTION_REQUEST = gql`
//   query connectionRequest($input: ConnectionRequestInput!) {
//     connectionRequest(input: $input) {
//       id
//       type
//       success
//       response
//     }
//   }
// `;

test('request resolver', async () => {
  const res = await request(
    null,
    {
      input: {
        args: 'args',
        arrayIndices: 'arrayIndices',
        contextId: 'contextId',
        input: 'input',
        lowdefyGlobal: 'lowdefyGlobal',
        pageId: 'pageId',
        requestId: 'requestId',
        state: 'state',
        urlQuery: 'urlQuery',
      },
    },
    { getController }
  );
  expect(res).toEqual({
    id: 'requestId',
    response: {
      args: 'args',
      arrayIndices: 'arrayIndices',
      contextId: 'contextId',
      input: 'input',
      lowdefyGlobal: 'lowdefyGlobal',
      pageId: 'pageId',
      requestId: 'requestId',
      state: 'state',
      urlQuery: 'urlQuery',
    },
    success: true,
    type: 'RequestType',
  });
});

// test('request graphql', async () => {
//   const res = await runTestQuery({
//     gqlQuery: CONNECTION_REQUEST,
//     variables: {
//       requestInput: {
//         requestId: 'requestId',
//         blockId: 'blockId',
//         pageId: 'pageId',
//         branch: 'branch',
//         input: {},
//         lowdefyGlobal: {},
//         state: {},
//         urlQuery: {},
//       },
//     },
//     loaders,
//     setters,
//   });
//   expect(res.errors).toBe(undefined);
//   expect(res.data.request.id).toEqual('pageId:requestResponse:requestId');
//   expect(res.data.request.success).toEqual(true);
//   expect(res.data.request.type).toEqual('AxiosHttp');
//   expect(res.data.request.response.status).toEqual(200);
//   expect(res.data.request.response.data.args.test).toEqual('test');
// });
