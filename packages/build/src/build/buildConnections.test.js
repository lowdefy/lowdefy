/*
  Copyright 2020-2021 Lowdefy, Inc

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

import buildConnections from './buildConnections';
import testContext from '../test/testContext';

const context = testContext();

test('buildConnections no connections', async () => {
  const components = {};
  const res = await buildConnections({ components, context });
  expect(res.connections).toBe(undefined);
});

test('buildConnections connections not an array', async () => {
  const components = {
    connections: 'connections',
  };
  const res = await buildConnections({ components, context });
  expect(res).toEqual({
    connections: 'connections',
  });
});

test('buildConnections', async () => {
  const components = {
    connections: [
      {
        id: 'connection1',
      },
      {
        id: 'connection2',
      },
    ],
  };
  const res = await buildConnections({ components, context });
  expect(res.connections).toEqual([
    {
      id: 'connection:connection1',
      connectionId: 'connection1',
    },
    {
      id: 'connection:connection2',
      connectionId: 'connection2',
    },
  ]);
});
