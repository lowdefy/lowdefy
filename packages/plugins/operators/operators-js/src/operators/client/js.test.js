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
import js from './js.js';

const rootLocation = 'root';
const map = {
  c1: ({ actions }) => {
    return actions('a');
  },
  c2: ({ event }) => {
    return event('e');
  },
  c3: ({ input }) => {
    return input('i');
  },
  c4: ({ location }) => {
    return location('l');
  },
  c5: ({ state }) => {
    return state('s');
  },
  c6: ({ request }) => {
    return request('r');
  },
  c7: ({ urlQuery }) => {
    return urlQuery('uq');
  },
  c8: ({ user }) => {
    return user('u');
  },
};

test('js default', async () => {
  const lowdefyOperators = {
    actions: jest.fn(),
    event: jest.fn(),
    input: jest.fn(),
    location: jest.fn(),
    state: jest.fn(),
    request: jest.fn(),
    url_query: jest.fn(),
    user: jest.fn(),
  };
  const keys = Object.keys(map);
  keys.forEach((key) => {
    js({ jsMap: map, operators: lowdefyOperators, location: rootLocation, params: key });
  });

  expect(lowdefyOperators.actions.mock.calls[0][0]['params']).toEqual('a');
  expect(lowdefyOperators.event.mock.calls[0][0]['params']).toEqual('e');
  expect(lowdefyOperators.input.mock.calls[0][0]['params']).toEqual('i');
  expect(lowdefyOperators.location.mock.calls[0][0]['params']).toEqual('l');
  expect(lowdefyOperators.state.mock.calls[0][0]['params']).toEqual('s');
  expect(lowdefyOperators.request.mock.calls[0][0]['params']).toEqual('r');
  expect(lowdefyOperators.url_query.mock.calls[0][0]['params']).toEqual('uq');
  expect(lowdefyOperators.user.mock.calls[0][0]['params']).toEqual('u');
});

test('js throw when invalid javascript function', async () => {
  const lowdefyOperators = {
    
  };
  const validMap = {
    client: () => {
      return notFunction('x');
    },
  };

  expect(() =>
    js({
      jsMap: validMap,
      operators: lowdefyOperators,
      location: rootLocation,
      params: 'client',
    })
  ).toThrow(
    `Operator Error: notFunction is not a function at root. Received function: ({ notOperator })=>{
            return notOperator('x');
        }`
  );
});
