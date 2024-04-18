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
    return actions('_a');
  },
  c2: ({ event }) => {
    return event('_e');
  },
  c3: ({ input }) => {
    return input('_i');
  },
  c4: ({ location }) => {
    return location('_l');
  },
  c5: ({ state }) => {
    return state('_s');
  },
  c6: ({ request }) => {
    return request('_r');
  },
  c7: ({ urlQuery }) => {
    return urlQuery('_uq');
  },
  c8: ({ user }) => {
    return user('_u');
  },
};

test('js default', async () => {
  const lowdefyOperators = {
    _actions: jest.fn(),
    _event: jest.fn(),
    _input: jest.fn(),
    _location: jest.fn(),
    _state: jest.fn(),
    _request: jest.fn(),
    _url_query: jest.fn(),
    _user: jest.fn(),
  };
  const keys = Object.keys(map);
  keys.forEach((key) => {
    js({ jsMap: map, operators: lowdefyOperators, location: rootLocation, params: key });
  });

  expect(lowdefyOperators._actions.mock.calls[0][0]['params']).toEqual('_a');
  expect(lowdefyOperators._event.mock.calls[0][0]['params']).toEqual('_e');
  expect(lowdefyOperators._input.mock.calls[0][0]['params']).toEqual('_i');
  expect(lowdefyOperators._location.mock.calls[0][0]['params']).toEqual('_l');
  expect(lowdefyOperators._state.mock.calls[0][0]['params']).toEqual('_s');
  expect(lowdefyOperators._request.mock.calls[0][0]['params']).toEqual('_r');
  expect(lowdefyOperators._url_query.mock.calls[0][0]['params']).toEqual('_uq');
  expect(lowdefyOperators._user.mock.calls[0][0]['params']).toEqual('_u');
});

test('js throw when invalid javascript function', async () => {
  const lowdefyOperators = {};
  const validMap = {
    client: () => {
      throw new Error('notFunction is not a valid JavaScript function');
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
    `Operator Error: notFunction is not a valid JavaScript function at root. Received function: ${validMap.client.toString()}`
  );
});
