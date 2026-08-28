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
import buildAuth from './buildAuth.js';
import testContext from '../../test-utils/testContext.js';

const context = testContext();

test('buildAgentAuth agents are public when no auth config is set', () => {
  const components = {
    agents: [{ id: 'agent-a' }, { id: 'agent-b' }],
    auth: { api: { roles: {} } },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent-a', auth: { public: true } },
    { id: 'agent-b', auth: { public: true } },
  ]);
});

test('buildAgentAuth all agents are protected when api.protected is true', () => {
  const components = {
    agents: [{ id: 'agent-a' }, { id: 'agent-b' }],
    auth: { api: { protected: true, roles: {} } },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent-a', auth: { public: false } },
    { id: 'agent-b', auth: { public: false } },
  ]);
});

test('buildAgentAuth api.public list exempts matching agents from protection', () => {
  const components = {
    agents: [{ id: 'agent-a' }, { id: 'agent-b' }],
    auth: { api: { public: ['agent-b'], roles: {} } },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent-a', auth: { public: false } },
    { id: 'agent-b', auth: { public: true } },
  ]);
});

test('buildAgentAuth api.protected list protects only matching agents', () => {
  const components = {
    agents: [{ id: 'agent-a' }, { id: 'agent-b' }],
    auth: { api: { protected: ['agent-a'], roles: {} } },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'agent-a', auth: { public: false } },
    { id: 'agent-b', auth: { public: true } },
  ]);
});

test('buildAgentAuth api.roles patterns assign roles to matching agents', () => {
  const components = {
    agents: [{ id: 'admin-agent' }, { id: 'agent-b' }],
    auth: { api: { protected: true, roles: { admin: ['admin-*'] } } },
  };
  const res = buildAgentAuth({ components, context });
  expect(res.agents).toEqual([
    { id: 'admin-agent', auth: { public: false, roles: ['admin'] } },
    { id: 'agent-b', auth: { public: false } },
  ]);
});

test('buildAgentAuth throws when an agent is both protected by roles and public', () => {
  const components = {
    agents: [{ id: 'admin-agent' }],
    auth: { api: { public: ['admin-agent'], roles: { admin: ['admin-agent'] } } },
  };
  expect(() => buildAgentAuth({ components, context })).toThrow(
    'Agent "admin-agent" is both protected by roles and public.'
  );
});

test('buildAuth stamps agent auth alongside api and page auth', () => {
  const components = {
    agents: [{ id: 'agent-a' }],
    api: [{ id: 'endpoint-a', type: 'Api' }],
    pages: [{ id: 'page-a', type: 'Context' }],
    auth: { api: { protected: true } },
  };
  const res = buildAuth({ components, context });
  expect(res.agents).toEqual([{ id: 'agent-a', auth: { public: false } }]);
  expect(res.api).toEqual([{ id: 'endpoint-a', type: 'Api', auth: { public: false } }]);
});

test('buildAgentAuth throws a located error when an agent id is a reserved name', () => {
  const agent = { id: '__proto__' };
  Object.defineProperty(agent, '~k', { value: 'agentKey', enumerable: false });
  const components = { agents: [agent], auth: { api: { roles: {} } } };
  expect(() => buildAgentAuth({ components, context })).toThrow(
    'Agent id "__proto__" is a reserved name and cannot be used as an id.'
  );
  try {
    buildAgentAuth({ components, context });
  } catch (e) {
    expect(e.configKey).toBe('agentKey');
  }
});

test('buildAgentAuth does not stamp Object.prototype as an agent roles list', () => {
  const before = Object.getOwnPropertyNames(Object.prototype);
  const components = { agents: [{ id: '__proto__' }], auth: { api: { roles: {} } } };
  expect(() => buildAgentAuth({ components, context })).toThrow();
  expect(components.agents[0].auth).toBeUndefined();
  expect(Object.getOwnPropertyNames(Object.prototype)).toEqual(before);
});
