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

import getAgentConfig from './getAgentConfig.js';

const logger = {
  debug: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('getAgentConfig returns agent config when file exists', async () => {
  const agentConfig = { agentId: 'my-agent', type: 'ClaudeAgent' };
  const readConfigFile = jest.fn().mockResolvedValue(agentConfig);

  const result = await getAgentConfig({ logger, readConfigFile }, { agentId: 'my-agent' });

  expect(readConfigFile).toHaveBeenCalledWith('agents/my-agent.json');
  expect(result).toBe(agentConfig);
});

test('getAgentConfig throws ConfigError when agent file returns null', async () => {
  const readConfigFile = jest.fn().mockResolvedValue(null);

  await expect(
    getAgentConfig({ logger, readConfigFile }, { agentId: 'missing-agent' })
  ).rejects.toThrow(ConfigError);
  await expect(
    getAgentConfig({ logger, readConfigFile }, { agentId: 'missing-agent' })
  ).rejects.toThrow('Agent "missing-agent" does not exist.');
});

test('getAgentConfig does not log debug on success', async () => {
  const agentConfig = { agentId: 'my-agent', type: 'ClaudeAgent' };
  const readConfigFile = jest.fn().mockResolvedValue(agentConfig);

  await getAgentConfig({ logger, readConfigFile }, { agentId: 'my-agent' });

  expect(logger.debug).not.toHaveBeenCalled();
});

test('getAgentConfig logs debug on error before throwing', async () => {
  const readConfigFile = jest.fn().mockResolvedValue(null);

  await expect(
    getAgentConfig({ logger, readConfigFile }, { agentId: 'bad-agent' })
  ).rejects.toThrow(ConfigError);

  expect(logger.debug).toHaveBeenCalledWith(
    { params: { agentId: 'bad-agent' }, err: expect.any(ConfigError) },
    'Agent "bad-agent" does not exist.'
  );
});

test('getAgentConfig translates the not-found error using i18n.messages for the active locale', async () => {
  const readConfigFile = jest.fn().mockResolvedValue(null);
  const i18n = {
    active: 'de-DE',
    defaultLocale: 'en-US',
    messages: {
      'de-DE': { 'agent.runtime.agentNotFound': 'Agent "{agentId}" existiert nicht.' },
    },
  };

  await expect(
    getAgentConfig({ i18n, logger, readConfigFile }, { agentId: 'bad-agent' })
  ).rejects.toThrow('Agent "bad-agent" existiert nicht.');
});
