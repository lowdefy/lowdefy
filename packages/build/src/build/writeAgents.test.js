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

import writeAgents from './writeAgents.js';
import testContext from '../test-utils/testContext.js';

const mockWriteBuildArtifact = jest.fn();

const context = testContext({ writeBuildArtifact: mockWriteBuildArtifact });

beforeEach(() => {
  mockWriteBuildArtifact.mockReset();
});

test('writeAgents writes agent', async () => {
  const components = {
    agents: [
      {
        id: 'agent:agent1',
        agentId: 'agent1',
        connectionId: 'connection1',
        properties: {
          prop: 'val',
        },
      },
    ],
  };
  await writeAgents({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'agents/agent1.json',
      '{"id":"agent:agent1","agentId":"agent1","connectionId":"connection1","properties":{"prop":"val"}}',
    ],
  ]);
});

test('writeAgents writes multiple agents', async () => {
  const components = {
    agents: [
      {
        id: 'agent:agent1',
        agentId: 'agent1',
        connectionId: 'connection1',
      },
      {
        id: 'agent:agent2',
        agentId: 'agent2',
        connectionId: 'connection2',
      },
    ],
  };
  await writeAgents({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([
    [
      'agents/agent1.json',
      '{"id":"agent:agent1","agentId":"agent1","connectionId":"connection1"}',
    ],
    [
      'agents/agent2.json',
      '{"id":"agent:agent2","agentId":"agent2","connectionId":"connection2"}',
    ],
  ]);
});

test('writeAgents no agents', async () => {
  const components = {
    agents: [],
  };
  await writeAgents({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});

test('writeAgents agents undefined', async () => {
  const components = {};
  await writeAgents({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});

test('writeAgents agents not an array', async () => {
  const components = {
    agents: 'agents',
  };
  await expect(writeAgents({ components, context })).rejects.toThrow('Agents is not an array.');
});

test('writeAgents agents null', async () => {
  const components = { agents: null };
  await writeAgents({ components, context });
  expect(mockWriteBuildArtifact.mock.calls).toEqual([]);
});
