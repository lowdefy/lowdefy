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

import buildConnections from './buildConnections.js';
import testContext from '../test/testContext.js';

const context = testContext();

test('buildConnections no connections', () => {
  const components = {};
  const res = buildConnections({ components, context });
  expect(res.connections).toBe(undefined);
});

test('buildConnections connections not an array', () => {
  const components = {
    connections: 'connections',
  };
  const res = buildConnections({ components, context });
  expect(res).toEqual({
    connections: 'connections',
  });
});

test('buildConnections', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
      {
        id: 'connection2',
        type: 'ConnectionType',
      },
    ],
  };
  const res = buildConnections({ components, context });
  expect(res.connections).toEqual([
    {
      id: 'connection:connection1',
      connectionId: 'connection1',
      type: 'ConnectionType',
    },
    {
      id: 'connection:connection2',
      connectionId: 'connection2',
      type: 'ConnectionType',
    },
  ]);
});

test('throw on missing id', () => {
  const components = {
    connections: [{ type: 'ConnectionType' }],
  };
  expect(() => buildConnections({ components, context })).toThrow('Connection id missing.');
});

test('connection id is not a string', () => {
  const components = {
    connections: [{ id: 1 }],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection id is not a string. Received 1.'
  );
});

test('throw on missing type', () => {
  const components = {
    connections: [{ id: 'connection1' }],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Connection type is not a string at connection "connection1". Received undefined.'
  );
});

test('throw on Duplicate ids', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
      {
        id: 'connection1',
        type: 'ConnectionType',
      },
    ],
  };
  expect(() => buildConnections({ components, context })).toThrow(
    'Duplicate connectionId "connection1".'
  );
});
