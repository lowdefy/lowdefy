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
    auth: {
      secret: { _secret: 'BETTER_AUTH_SECRET' },
      database: { id: 'auth_db', type: 'MongoDBAuthAdapter', properties: {} },
      emailAndPassword: { enabled: true },
      api: { protected: true },
    },
  };
  const res = buildAuth({ components, context });
  expect(res.agents).toEqual([{ id: 'agent-a', auth: { public: false } }]);
  expect(res.api).toEqual([{ id: 'endpoint-a', type: 'Api', auth: { public: false } }]);
});

test('buildAgentAuth rejects a reserved agent id with the validateId message', () => {
  const components = {
    agents: [{ id: '__proto__' }],
    auth: { api: { roles: {} } },
  };
  expect(() => buildAgentAuth({ components, context })).toThrow(
    'Agent id "__proto__" is a reserved name and cannot be used as an id.'
  );
});

describe('buildAgentAuth agents from a module', () => {
  const moduleAgentId = 'support/triage';

  function moduleComponents(apiAuth) {
    return {
      agents: [{ id: 'concierge' }, { id: moduleAgentId }],
      auth: { configured: true, api: { roles: {}, ...apiAuth } },
    };
  }

  function moduleContext({ declaredPublic = [] } = {}) {
    return {
      ...context,
      moduleEntityIds: { agents: [moduleAgentId] },
      moduleAuthPublicEntities: { agents: declaredPublic },
    };
  }

  function resolvedAuth(components) {
    return components.agents.map((agent) => agent.auth);
  }

  test('a module agent is protected when auth is configured and the app sets no rule', () => {
    const components = moduleComponents({});
    buildAgentAuth({ components, context: moduleContext() });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: false }]);
  });

  test('a module agent a protected list does not name stays protected', () => {
    const components = moduleComponents({ protected: ['concierge'] });
    buildAgentAuth({ components, context: moduleContext() });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: false }]);
  });

  test('app api public true makes a module agent public', () => {
    const components = moduleComponents({ public: true });
    buildAgentAuth({ components, context: moduleContext() });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: true }]);
  });

  test('an app api public list naming a module agent makes it public', () => {
    const components = moduleComponents({ public: ['support/**'] });
    buildAgentAuth({ components, context: moduleContext() });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: true }]);
  });

  test('app api roles on a module agent apply as for an app agent', () => {
    const components = moduleComponents({ roles: { agent: ['support/**'] } });
    buildAgentAuth({ components, context: moduleContext() });
    expect(components.agents[1].auth).toEqual({ public: false, roles: ['agent'] });
  });

  test('a module-declared public agent is public with no app rule', () => {
    const components = moduleComponents({});
    buildAgentAuth({ components, context: moduleContext({ declaredPublic: [moduleAgentId] }) });
    expect(components.agents[1].auth).toEqual({ public: true });
  });

  test('a module-declared public agent stays public under protected true', () => {
    const components = moduleComponents({ protected: true });
    buildAgentAuth({ components, context: moduleContext({ declaredPublic: [moduleAgentId] }) });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: true }]);
  });

  test('a module agent follows the app rules when auth is not configured', () => {
    const components = moduleComponents({});
    components.auth.configured = false;
    buildAgentAuth({ components, context: moduleContext() });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: true }]);
  });
});
