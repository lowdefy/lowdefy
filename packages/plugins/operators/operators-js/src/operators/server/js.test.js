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

import { jest } from '@jest/globals';
import js from './js.js';

const rootLocation = 'root';
const map = {
  c1: ({ payload }) => {
    return payload('p');
  },
  c2: ({ secret }) => {
    return secret('s');
  },
  c3: ({ user }) => {
    return user('u');
  },
};

test('js default', async () => {
  const lowdefyOperators = {
    _payload: jest.fn(),
    _secret: jest.fn(),
    _user: jest.fn(),
  };
  const keys = Object.keys(map);
  keys.forEach((key) => {
    js({ jsMap: map, operators: lowdefyOperators, location: rootLocation, params: key });
  });

  expect(lowdefyOperators._payload.mock.calls[0][0]['params']).toEqual('p');
  expect(lowdefyOperators._secret.mock.calls[0][0]['params']).toEqual('s');
  expect(lowdefyOperators._user.mock.calls[0][0]['params']).toEqual('u');
});

test('js throw when invalid javascript function', async () => {
  const lowdefyOperators = {};
  const validMap = {
    c1: () => {
      throw new Error('c1 is not a proper JavaScript function');
    },
  };

  expect(() =>
    js({
      jsMap: validMap,
      operators: lowdefyOperators,
      location: rootLocation,
      params: 'c1',
    })
  ).toThrow('c1 is not a proper JavaScript function');
});

test('js passes args through when params is object form', async () => {
  const receivedArgs = [];
  const argsMap = {
    h1: ({ args }) => {
      receivedArgs.push(args);
      return args?.a + args?.b;
    },
  };
  const result = js({
    jsMap: argsMap,
    operators: {},
    location: rootLocation,
    params: { fn: 'h1', args: { a: 2, b: 3 } },
  });
  expect(result).toEqual(5);
  expect(receivedArgs[0]).toEqual({ a: 2, b: 3 });
});

test('js passes args as undefined when object form omits args', async () => {
  const receivedArgs = [];
  const argsMap = {
    h1: ({ args }) => {
      receivedArgs.push(args);
      return 'ok';
    },
  };
  js({
    jsMap: argsMap,
    operators: {},
    location: rootLocation,
    params: { fn: 'h1' },
  });
  expect(receivedArgs[0]).toBeUndefined();
});

test('js throws when object-form hash is not in map', async () => {
  expect(() =>
    js({
      jsMap: {},
      operators: {},
      location: rootLocation,
      params: { fn: 'missing', args: { a: 1 } },
    })
  ).toThrow(
    '_js function not found. The function may not have been built yet. Received hash: missing'
  );
});
