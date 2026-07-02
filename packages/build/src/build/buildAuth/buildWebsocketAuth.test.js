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

import buildWebsocketAuth from './buildWebsocketAuth.js';
import testContext from '../../test-utils/testContext.js';

const context = testContext();

test('buildWebsocketAuth returns components when no websockets defined', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toBe(undefined);
});

test('buildWebsocketAuth sets all websockets public by default', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: true } },
    { id: 'ws2', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildWebsocketAuth protected true makes all websockets protected', () => {
  const components = {
    auth: {
      websockets: {
        protected: true,
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});

test('buildWebsocketAuth protected list protects only listed websockets', () => {
  const components = {
    auth: {
      websockets: {
        protected: ['ws1'],
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false } },
    { id: 'ws2', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildWebsocketAuth public list protects all websockets not listed', () => {
  const components = {
    auth: {
      websockets: {
        public: ['ws1'],
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: true } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});

test('buildWebsocketAuth roles protect websockets and list the granted roles', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
          role2: ['ws1', 'ws2'],
        },
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
      { id: 'ws3', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false, roles: ['role1', 'role2'] } },
    { id: 'ws2', type: 'Channel', auth: { public: false, roles: ['role2'] } },
    { id: 'ws3', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildWebsocketAuth throws when a websocket is both protected by roles and public', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
        },
        public: ['ws1'],
      },
    },
    websockets: [{ id: 'ws1', type: 'Channel' }],
  };
  expect(() => buildWebsocketAuth({ components, context })).toThrow(
    'Websocket "ws1" is both protected by roles and public.'
  );
});

test('buildWebsocketAuth roles with protected true still assigns roles', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
        },
        protected: true,
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildWebsocketAuth({ components, context });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false, roles: ['role1'] } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});
