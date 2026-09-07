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

import buildWebsockets from './buildWebsockets.js';
import createCounter from '../utils/createCounter.js';
import testContext from '../test-utils/testContext.js';

function createTestContext() {
  const context = testContext();
  // testContext does not yet include the websockets counter added to createContext
  context.typeCounters.websockets = createCounter();
  return context;
}

test('buildWebsockets returns components unchanged when no websockets defined', () => {
  const context = createTestContext();
  const components = {};
  const res = buildWebsockets({ components, context });
  expect(res.websockets).toBe(undefined);
  expect(context.websocketIds).toEqual(new Set());
});

test('buildWebsockets throws when websockets is not an array', () => {
  const context = createTestContext();
  const components = {
    websockets: 'websockets',
  };
  expect(() => buildWebsockets({ components, context })).toThrow('Websockets is not an array.');
});

test('buildWebsockets throws when websocket id is missing', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ type: 'Channel' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket id missing at websocket 0.'
  );
});

test('buildWebsockets throws when websocket id is not a string', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: true, type: 'Channel' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket id is not a string at websocket 0.'
  );
});

test('buildWebsockets throws when websocket id contains invalid characters', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'my.websocket', type: 'Channel' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket id "my.websocket" contains invalid characters.'
  );
});

test('buildWebsockets throws when websocket id is a reserved name', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: '__proto__', type: 'Channel' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket id "__proto__" is a reserved name and cannot be used as an id.'
  );
});

test('buildWebsockets throws on duplicate websocket ids', () => {
  const context = createTestContext();
  const components = {
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws1', type: 'Channel' },
    ],
  };
  expect(() => buildWebsockets({ components, context })).toThrow('Duplicate websocketId "ws1".');
});

test('buildWebsockets throws when websocket type is not a string', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 123 }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket type is not a string at websocket "ws1".'
  );
});

test('buildWebsockets throws when websocket type is missing', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket type is not a string at websocket "ws1".'
  );
});

test('buildWebsockets throws when connectionId is not a string', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', connectionId: 123 }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket connectionId is not a string at websocket "ws1".'
  );
});

test('buildWebsockets throws when connectionId references a connection which does not exist', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', connectionId: 'missing_connection' }],
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'ConnectionType' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket "ws1" references connectionId "missing_connection" which does not exist.'
  );
});

test('buildWebsockets throws when connectionId does not exist and no connections are defined', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', connectionId: 'missing_connection' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket "ws1" references connectionId "missing_connection" which does not exist.'
  );
});

test('buildWebsockets passes when connectionId matches a connection renamed by buildConnections', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', connectionId: 'conn1' }],
    connections: [{ id: 'connection:conn1', connectionId: 'conn1', type: 'ConnectionType' }],
  };
  const res = buildWebsockets({ components, context });
  expect(res.websockets[0].connectionId).toBe('conn1');
});

test('buildWebsockets passes when connectionId matches a connection with a plain id', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', connectionId: 'conn1' }],
    connections: [{ id: 'conn1', type: 'ConnectionType' }],
  };
  const res = buildWebsockets({ components, context });
  expect(res.websockets[0].connectionId).toBe('conn1');
});

test('buildWebsockets allows websockets without a connectionId', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel' }],
  };
  const res = buildWebsockets({ components, context });
  expect(res.websockets).toEqual([
    {
      id: 'websocket:ws1',
      websocketId: 'ws1',
      type: 'Channel',
      properties: {},
    },
  ]);
});

test('buildWebsockets sets properties to an empty object by default', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel' }],
  };
  const res = buildWebsockets({ components, context });
  expect(res.websockets[0].properties).toEqual({});
});

test('buildWebsockets throws when properties is not an object', () => {
  const context = createTestContext();
  const components = {
    websockets: [{ id: 'ws1', type: 'Channel', properties: 'properties' }],
  };
  expect(() => buildWebsockets({ components, context })).toThrow(
    'Websocket properties is not an object at websocket "ws1".'
  );
});

test('buildWebsockets renames id to internal format and sets websocketId', () => {
  const context = createTestContext();
  const components = {
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel', properties: { url: 'wss://example.com' } },
    ],
  };
  const res = buildWebsockets({ components, context });
  expect(res.websockets).toEqual([
    {
      id: 'websocket:ws1',
      websocketId: 'ws1',
      type: 'Channel',
      properties: {},
    },
    {
      id: 'websocket:ws2',
      websocketId: 'ws2',
      type: 'Channel',
      properties: { url: 'wss://example.com' },
    },
  ]);
});

test('buildWebsockets populates context.websocketIds with original ids', () => {
  const context = createTestContext();
  const components = {
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Stream' },
    ],
  };
  buildWebsockets({ components, context });
  expect(context.websocketIds).toEqual(new Set(['ws1', 'ws2']));
});

test('buildWebsockets counts websocket types in context.typeCounters.websockets', () => {
  const context = createTestContext();
  const components = {
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
      { id: 'ws3', type: 'Stream' },
    ],
  };
  buildWebsockets({ components, context });
  expect(context.typeCounters.websockets.getCounts()).toEqual({
    Channel: 2,
    Stream: 1,
  });
});

test('buildWebsockets counts server operators in websocket properties', () => {
  const context = createTestContext();
  const components = {
    websockets: [
      {
        id: 'ws1',
        type: 'Channel',
        properties: {
          url: { '_string.concat': ['wss://', { _secret: 'WS_HOST' }] },
          token: { _secret: 'WS_TOKEN' },
        },
      },
    ],
  };
  buildWebsockets({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _string: 1,
    _secret: 2,
  });
});
