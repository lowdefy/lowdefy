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
import { ConfigError } from '@lowdefy/errors';
import getAgentResolver from './getAgentResolver.js';

const logger = { debug: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
});

test('getAgentResolver returns agent type from registry', () => {
  const mockAgentType = { run: jest.fn() };
  const agents = { AnthropicChat: mockAgentType };
  const agentConfig = { type: 'AnthropicChat', agentId: 'my-agent' };

  const result = getAgentResolver({ agents, logger }, { agentConfig });

  expect(result).toBe(mockAgentType);
});

test('getAgentResolver throws ConfigError when type not in registry', () => {
  const agents = {};
  const agentConfig = { type: 'UnknownType', agentId: 'my-agent' };

  expect(() => getAgentResolver({ agents, logger }, { agentConfig })).toThrow(
    new ConfigError('Agent type "UnknownType" can not be found.')
  );
});

test('getAgentResolver includes configKey in error', () => {
  const agents = {};
  const agentConfig = { type: 'UnknownType', agentId: 'my-agent', '~k': 'agents.0' };

  let caughtError;
  try {
    getAgentResolver({ agents, logger }, { agentConfig });
  } catch (e) {
    caughtError = e;
  }

  expect(caughtError).toBeInstanceOf(ConfigError);
  expect(caughtError.configKey).toBe('agents.0');
});

test('getAgentResolver logs debug on error before throwing', () => {
  const agents = {};
  const agentConfig = { type: 'MissingType', agentId: 'my-agent' };

  try {
    getAgentResolver({ agents, logger }, { agentConfig });
  } catch (e) {
    // expected
  }

  expect(logger.debug).toHaveBeenCalledWith(
    { params: { id: 'my-agent', type: 'MissingType' }, err: expect.any(ConfigError) },
    'Agent type "MissingType" can not be found.'
  );
});
