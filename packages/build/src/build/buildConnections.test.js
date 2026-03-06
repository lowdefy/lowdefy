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

import buildConnections from './buildConnections.js';
import testContext from '../test-utils/testContext.js';

const context = testContext();

test('buildConnections no connections', () => {
  const components = {};
  const res = buildConnections({ components, context });
  expect(res.connections).toBe(undefined);
});

// Note: "connections not an array" is validated by schema (testSchema.js)
// buildConnections assumes valid input after schema validation

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

// Note: Missing id, invalid id type, and missing/invalid type are validated by schema
// See index.errors.test.js for A2 (missing id), A1 (invalid type)

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

test('count operators', () => {
  const components = {
    connections: [
      {
        id: 'connection1',
        type: 'MongoDBCollection',
        properties: {
          collection: { _payload: 'collection' },
          databaseUri: {
            '_string.concat': ['db', 'uri'],
          },
        },
      },
      {
        id: 'connection2',
        type: 'MongoDBCollection',
        properties: {
          changeLog: {
            _payload: 'changelog',
          },
          collection: { '_number.toString': 10 },
          write: {
            _eq: [true, false],
          },
        },
      },
    ],
  };
  buildConnections({ components, context });
  expect(context.typeCounters.operators.server.getCounts()).toEqual({
    _eq: 1,
    _number: 1,
    _payload: 2,
    _string: 1,
  });
});
