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

import buildAgentAuth from './buildAgentAuth.js';
import testContext from '../../test-utils/testContext.js';

const context = testContext();

test('buildAgentAuth sets externalApi enabled false when agent not in any auth list', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent1', externalApi: { enabled: false } },
    { id: 'agent2', externalApi: { enabled: false } },
  ]);
});

test('buildAgentAuth sets externalApi enabled true with auth public false when in protected list', () => {
  const components = {
    auth: {
      agents: {
        protected: ['agent1'],
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent1',
      externalApi: { enabled: true, auth: { public: false } },
    },
    { id: 'agent2', externalApi: { enabled: false } },
  ]);
});

test('buildAgentAuth sets externalApi enabled true with auth public true when in public list', () => {
  const components = {
    auth: {
      agents: {
        public: ['agent1'],
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent1',
      externalApi: { enabled: true, auth: { public: true } },
    },
    {
      id: 'agent2',
      externalApi: { enabled: true, auth: { public: false } },
    },
  ]);
});

test('buildAgentAuth sets externalApi enabled true with roles when in roles config', () => {
  const components = {
    auth: {
      agents: {
        roles: {
          admin: ['agent1'],
        },
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent1',
      externalApi: { enabled: true, auth: { public: false, roles: ['admin'] } },
    },
    { id: 'agent2', externalApi: { enabled: false } },
  ]);
});

test('buildAgentAuth handles no auth.agents config', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent1', externalApi: { enabled: false } },
  ]);
});

test('buildAgentAuth handles empty agents array', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
    agents: [],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([]);
});

test('buildAgentAuth handles no agents on components', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toBeUndefined();
});

test('buildAgentAuth all agents protected when protected is true', () => {
  const components = {
    auth: {
      agents: {
        protected: true,
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent1',
      externalApi: { enabled: true, auth: { public: false } },
    },
    {
      id: 'agent2',
      externalApi: { enabled: true, auth: { public: false } },
    },
  ]);
});

test('buildAgentAuth public list makes unlisted agents protected', () => {
  const components = {
    auth: {
      agents: {
        public: ['agent1'],
        roles: {},
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents[0].externalApi).toEqual({
    enabled: true,
    auth: { public: true },
  });
  expect(res.agents[1].externalApi).toEqual({
    enabled: true,
    auth: { public: false },
  });
});

test('buildAgentAuth throws when agent is both in roles and public', () => {
  const components = {
    auth: {
      agents: {
        roles: {
          admin: ['agent1'],
        },
        public: ['agent1'],
      },
    },
    agents: [{ id: 'agent1' }],
  };
  expect(() => buildAgentAuth({ components, context })).toThrow(
    'Agent "agent1" is both protected by roles and public.'
  );
});

test('buildAgentAuth supports glob patterns', () => {
  const components = {
    auth: {
      agents: {
        protected: ['chat-*'],
        roles: {},
      },
    },
    agents: [{ id: 'chat-support' }, { id: 'chat-sales' }, { id: 'search-agent' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'chat-support',
      externalApi: { enabled: true, auth: { public: false } },
    },
    {
      id: 'chat-sales',
      externalApi: { enabled: true, auth: { public: false } },
    },
    {
      id: 'search-agent',
      externalApi: { enabled: false },
    },
  ]);
});

test('buildAgentAuth multiple roles on single agent', () => {
  const components = {
    auth: {
      agents: {
        roles: {
          admin: ['agent1'],
          editor: ['agent1', 'agent2'],
        },
      },
    },
    agents: [{ id: 'agent1' }, { id: 'agent2' }, { id: 'agent3' }],
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    {
      id: 'agent1',
      externalApi: { enabled: true, auth: { public: false, roles: ['admin', 'editor'] } },
    },
    {
      id: 'agent2',
      externalApi: { enabled: true, auth: { public: false, roles: ['editor'] } },
    },
    {
      id: 'agent3',
      externalApi: { enabled: false },
    },
  ]);
});
