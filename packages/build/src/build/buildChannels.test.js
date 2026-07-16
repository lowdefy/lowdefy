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

import buildChannels from './buildChannels.js';
import testContext from '../test-utils/testContext.js';

function contextWithAgents(agentIds = []) {
  const context = testContext();
  context.agentIds = new Set(agentIds);
  return context;
}

const publicAgent = {
  agentId: 'support-bot',
  id: 'agent:support-bot',
  auth: { public: true },
  type: 'ClaudeAgent',
};

test('buildChannels writes unconfigured defaults when no channels block is defined', () => {
  const context = contextWithAgents();
  const components = {};
  const res = buildChannels({ components, context });
  expect(res.channels).toEqual({ configured: false });
});

test('buildChannels sets defaults and configured for a valid telegram channel', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [publicAgent],
    channels: { telegram: { agentId: 'support-bot' } },
  };
  const res = buildChannels({ components, context });
  expect(res.channels).toEqual({
    configured: true,
    telegram: { agentId: 'support-bot', roles: [], attributes: {} },
  });
});

test('buildChannels keeps configured roles and attributes', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [publicAgent],
    channels: {
      telegram: { agentId: 'support-bot', roles: ['support'], attributes: { source: 'telegram' } },
    },
  };
  const res = buildChannels({ components, context });
  expect(res.channels.telegram).toEqual({
    agentId: 'support-bot',
    roles: ['support'],
    attributes: { source: 'telegram' },
  });
});

test('buildChannels throws when the referenced agent does not exist', () => {
  const context = contextWithAgents([]);
  const components = { channels: { telegram: { agentId: 'missing-bot' } } };
  expect(() => buildChannels({ components, context })).toThrow(
    'Channel "telegram" references agent "missing-bot" which does not exist.'
  );
});

test('buildChannels throws when the channel roles cannot satisfy the agent roles', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [{ ...publicAgent, auth: { public: false, roles: ['admin'] } }],
    channels: { telegram: { agentId: 'support-bot', roles: ['support'] } },
  };
  expect(() => buildChannels({ components, context })).toThrow(
    'Channel "telegram" cannot call agent "support-bot" - the agent requires one of roles ["admin"] but the channel\'s roles are ["support"]. Grant the channel a qualifying role or make the agent public.'
  );
});

test('buildChannels passes when the channel holds a required agent role', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [{ ...publicAgent, auth: { public: false, roles: ['support', 'admin'] } }],
    channels: { telegram: { agentId: 'support-bot', roles: ['support'] } },
  };
  const res = buildChannels({ components, context });
  expect(res.channels.configured).toBe(true);
});

test('buildChannels passes a protected agent without roles - the service identity is authenticated', () => {
  const context = contextWithAgents(['support-bot']);
  const components = {
    agents: [{ ...publicAgent, auth: { public: false } }],
    channels: { telegram: { agentId: 'support-bot' } },
  };
  const res = buildChannels({ components, context });
  expect(res.channels.configured).toBe(true);
});
