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

import validateCallAgentSteps from './validateCallAgentSteps.js';
import testContext from '../test-utils/testContext.js';

const mockLogWarn = jest.fn();
const logger = { warn: mockLogWarn };

function createContext({ agentIds = [] } = {}) {
  const context = testContext({ logger });
  context.agentIds = new Set(agentIds);
  return context;
}

function callAgentStep(overrides = {}) {
  return {
    id: 'agent:my_endpoint:run_agent',
    stepId: 'run_agent',
    endpointId: 'my_endpoint',
    type: 'CallAgent',
    properties: { agentId: 'research_agent', prompt: 'Go.' },
    ...overrides,
  };
}

beforeEach(() => {
  mockLogWarn.mockReset();
});

test('validateCallAgentSteps passes when the referenced agent exists', () => {
  const context = createContext({ agentIds: ['research_agent'] });
  const components = {
    api: [{ endpointId: 'my_endpoint', routine: [callAgentStep()] }],
    agents: [{ agentId: 'research_agent', tools: [] }],
  };
  expect(() => validateCallAgentSteps({ components, context })).not.toThrow();
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateCallAgentSteps throws when a static agentId does not exist', () => {
  const context = createContext({ agentIds: ['other_agent'] });
  const components = {
    api: [{ endpointId: 'my_endpoint', routine: [callAgentStep()] }],
    agents: [{ agentId: 'other_agent', tools: [] }],
  };
  expect(() => validateCallAgentSteps({ components, context })).toThrow(
    'CallAgent step "run_agent" at endpoint "my_endpoint" references agent "research_agent" which does not exist.'
  );
});

test('validateCallAgentSteps throws when no agents are defined at all', () => {
  const context = createContext();
  const components = {
    api: [{ endpointId: 'my_endpoint', routine: [callAgentStep()] }],
  };
  expect(() => validateCallAgentSteps({ components, context })).toThrow(
    'references agent "research_agent" which does not exist.'
  );
});

test('validateCallAgentSteps finds CallAgent steps nested in control structures', () => {
  const context = createContext({ agentIds: ['other_agent'] });
  const components = {
    api: [
      {
        endpointId: 'my_endpoint',
        routine: [
          {
            ':if': true,
            ':then': [callAgentStep()],
          },
        ],
      },
    ],
    agents: [{ agentId: 'other_agent', tools: [] }],
  };
  expect(() => validateCallAgentSteps({ components, context })).toThrow(
    'references agent "research_agent" which does not exist.'
  );
});

test('validateCallAgentSteps skips dynamic (operator) agentIds', () => {
  const context = createContext();
  const components = {
    api: [
      {
        endpointId: 'my_endpoint',
        routine: [
          callAgentStep({ properties: { agentId: { _payload: 'agent' }, prompt: 'Go.' } }),
        ],
      },
    ],
  };
  expect(() => validateCallAgentSteps({ components, context })).not.toThrow();
  expect(mockLogWarn).not.toHaveBeenCalled();
});

test('validateCallAgentSteps warns when the referenced agent has confirm tools', () => {
  const context = createContext({ agentIds: ['research_agent'] });
  const components = {
    api: [{ endpointId: 'my_endpoint', routine: [callAgentStep()] }],
    agents: [
      {
        agentId: 'research_agent',
        tools: [
          { endpointId: 'lookup-data' },
          { endpointId: 'create-ticket', confirm: true },
        ],
      },
    ],
  };
  validateCallAgentSteps({ components, context });
  expect(mockLogWarn).toHaveBeenCalledWith(
    'Agent "research_agent" has tools with confirm: true, but tool approval is not supported when run from a CallAgent step. Tools will auto-execute.'
  );
});

test('validateCallAgentSteps is a no-op when there are no CallAgent steps', () => {
  const context = createContext();
  const components = {
    api: [
      {
        endpointId: 'my_endpoint',
        routine: [
          {
            id: 'request:my_endpoint:db_step',
            stepId: 'db_step',
            type: 'MongoDBInsertOne',
            connectionId: 'connection',
          },
        ],
      },
    ],
  };
  expect(() => validateCallAgentSteps({ components, context })).not.toThrow();
  expect(mockLogWarn).not.toHaveBeenCalled();
});
