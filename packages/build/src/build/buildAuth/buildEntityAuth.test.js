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

import buildEntityAuth from './buildEntityAuth.js';

test('buildEntityAuth websockets: returns components when no websockets defined', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toBe(undefined);
});

test('buildEntityAuth websockets: sets all websockets public by default', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: true } },
    { id: 'ws2', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildEntityAuth websockets: protected true makes all websockets protected', () => {
  const components = {
    auth: {
      websockets: {
        protected: true,
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});

test('buildEntityAuth websockets: protected list protects only listed websockets', () => {
  const components = {
    auth: {
      websockets: {
        protected: ['ws1'],
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false } },
    { id: 'ws2', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildEntityAuth websockets: public list protects all websockets not listed', () => {
  const components = {
    auth: {
      websockets: {
        public: ['ws1'],
        roles: {},
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: true } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});

test('buildEntityAuth websockets: roles protect websockets and list the granted roles', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
          role2: ['ws1', 'ws2'],
        },
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
      { id: 'ws3', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false, roles: ['role1', 'role2'] } },
    { id: 'ws2', type: 'Channel', auth: { public: false, roles: ['role2'] } },
    { id: 'ws3', type: 'Channel', auth: { public: true } },
  ]);
});

test('buildEntityAuth websockets: throws when a websocket is both protected by roles and public', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
        },
        public: ['ws1'],
      },
    },
    websockets: [{ id: 'ws1', type: 'Channel' }],
  };
  expect(() => buildEntityAuth({ components, entity: 'websockets' })).toThrow(
    'Websocket "ws1" is both protected by roles and public.'
  );
});

test('buildEntityAuth websockets: roles with protected true still assigns roles', () => {
  const components = {
    auth: {
      websockets: {
        roles: {
          role1: ['ws1'],
        },
        protected: true,
      },
    },
    websockets: [
      { id: 'ws1', type: 'Channel' },
      { id: 'ws2', type: 'Channel' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'websockets' });
  expect(res.websockets).toEqual([
    { id: 'ws1', type: 'Channel', auth: { public: false, roles: ['role1'] } },
    { id: 'ws2', type: 'Channel', auth: { public: false } },
  ]);
});

test('buildEntityAuth pages: the 404 page is always public even when all pages are protected', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        roles: {},
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: '404', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: {}, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'home', type: 'Context', auth: { public: false } },
    { id: '404', type: 'Context', auth: { public: true } },
  ]);
});

test('buildEntityAuth pages: pages holding an authPages role are public under protected true', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        signUp: '/signup',
        error: '/auth/error',
        forgotPassword: '/forgot-password',
        resetPassword: '/reset-password',
        verifyEmail: '/verify-email',
      },
      pages: {
        protected: true,
        roles: {},
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'login', type: 'Context' },
      { id: 'verify-email', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: {}, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'home', type: 'Context', auth: { public: false } },
    { id: 'login', type: 'Context', auth: { public: true } },
    { id: 'verify-email', type: 'Context', auth: { public: true } },
  ]);
});

test('buildEntityAuth pages: pages holding an authPages role are public without being in the public list', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/crm/login',
      },
      pages: {
        public: ['home'],
        roles: {},
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'crm/login', type: 'Context' },
      { id: 'dashboard', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: {}, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'home', type: 'Context', auth: { public: true } },
    { id: 'crm/login', type: 'Context', auth: { public: true } },
    { id: 'dashboard', type: 'Context', auth: { public: false } },
  ]);
});

test('buildEntityAuth pages: pages holding an authPages role never join a protected list', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
      },
      pages: {
        protected: ['login', 'dashboard'],
        roles: {},
      },
    },
    pages: [
      { id: 'login', type: 'Context' },
      { id: 'dashboard', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: {}, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'login', type: 'Context', auth: { public: true } },
    { id: 'dashboard', type: 'Context', auth: { public: false } },
  ]);
});

test('buildEntityAuth pages: module-contributed public pages stay public under protected true', () => {
  const components = {
    auth: {
      pages: {
        protected: true,
        roles: {},
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'crm/accept-invitation', type: 'Context' },
    ],
  };
  const context = { moduleAuthPublicPages: ['crm/accept-invitation'] };
  const res = buildEntityAuth({ components, context, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'home', type: 'Context', auth: { public: false } },
    { id: 'crm/accept-invitation', type: 'Context', auth: { public: true } },
  ]);
});

test('buildEntityAuth pages: module-contributed public pages never join a protected list', () => {
  const components = {
    auth: {
      pages: {
        protected: ['crm/accept-invitation', 'dashboard'],
        roles: {},
      },
    },
    pages: [
      { id: 'crm/accept-invitation', type: 'Context' },
      { id: 'dashboard', type: 'Context' },
    ],
  };
  const context = { moduleAuthPublicPages: ['crm/accept-invitation'] };
  const res = buildEntityAuth({ components, context, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'crm/accept-invitation', type: 'Context', auth: { public: true } },
    { id: 'dashboard', type: 'Context', auth: { public: false } },
  ]);
});

test('buildEntityAuth agents: returns components when no agents defined', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toBe(undefined);
});

test('buildEntityAuth agents: sets all agents public by default', () => {
  const components = {
    auth: {
      agents: {
        roles: {},
      },
    },
    agents: [
      { id: 'support-bot', type: 'ClaudeAgent' },
      { id: 'internal-bot', type: 'ClaudeAgent' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toEqual([
    { id: 'support-bot', type: 'ClaudeAgent', auth: { public: true } },
    { id: 'internal-bot', type: 'ClaudeAgent', auth: { public: true } },
  ]);
});

test('buildEntityAuth agents: protected true makes all agents protected', () => {
  const components = {
    auth: {
      agents: {
        protected: true,
        roles: {},
      },
    },
    agents: [
      { id: 'support-bot', type: 'ClaudeAgent' },
      { id: 'internal-bot', type: 'ClaudeAgent' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toEqual([
    { id: 'support-bot', type: 'ClaudeAgent', auth: { public: false } },
    { id: 'internal-bot', type: 'ClaudeAgent', auth: { public: false } },
  ]);
});

test('buildEntityAuth agents: protected list protects only listed agents', () => {
  const components = {
    auth: {
      agents: {
        protected: ['internal-bot'],
        roles: {},
      },
    },
    agents: [
      { id: 'support-bot', type: 'ClaudeAgent' },
      { id: 'internal-bot', type: 'ClaudeAgent' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toEqual([
    { id: 'support-bot', type: 'ClaudeAgent', auth: { public: true } },
    { id: 'internal-bot', type: 'ClaudeAgent', auth: { public: false } },
  ]);
});

test('buildEntityAuth agents: public list protects all agents not listed', () => {
  const components = {
    auth: {
      agents: {
        public: ['support-bot'],
        roles: {},
      },
    },
    agents: [
      { id: 'support-bot', type: 'ClaudeAgent' },
      { id: 'internal-bot', type: 'ClaudeAgent' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toEqual([
    { id: 'support-bot', type: 'ClaudeAgent', auth: { public: true } },
    { id: 'internal-bot', type: 'ClaudeAgent', auth: { public: false } },
  ]);
});

test('buildEntityAuth agents: roles protect agents and list the granted roles', () => {
  const components = {
    auth: {
      agents: {
        roles: {
          admin: ['internal-*'],
          support: ['support-bot', 'internal-bot'],
        },
      },
    },
    agents: [
      { id: 'support-bot', type: 'ClaudeAgent' },
      { id: 'internal-bot', type: 'ClaudeAgent' },
      { id: 'open-bot', type: 'ClaudeAgent' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'agents' });
  expect(res.agents).toEqual([
    { id: 'support-bot', type: 'ClaudeAgent', auth: { public: false, roles: ['support'] } },
    { id: 'internal-bot', type: 'ClaudeAgent', auth: { public: false, roles: ['admin', 'support'] } },
    { id: 'open-bot', type: 'ClaudeAgent', auth: { public: true } },
  ]);
});

test('buildEntityAuth agents: throws when an agent is both protected by roles and public', () => {
  const components = {
    auth: {
      agents: {
        roles: {
          admin: ['support-bot'],
        },
        public: ['support-bot'],
      },
    },
    agents: [{ id: 'support-bot', type: 'ClaudeAgent' }],
  };
  expect(() => buildEntityAuth({ components, entity: 'agents' })).toThrow(
    'Agent "support-bot" is both protected by roles and public.'
  );
});

test('buildEntityAuth api: the roles-and-public conflict names the endpoint', () => {
  const components = {
    auth: {
      api: {
        roles: {
          role1: ['ep1'],
        },
        public: ['ep1'],
      },
    },
    api: [{ id: 'ep1', type: 'Api' }],
  };
  expect(() => buildEntityAuth({ components, entity: 'api' })).toThrow(
    'Endpoint "ep1" is both protected by roles and public.'
  );
});

test('buildEntityAuth api: throws when a webhook endpoint is only implicitly public (in neither list)', () => {
  const components = {
    auth: {
      api: {
        roles: {},
      },
    },
    api: [{ id: 'hook', type: 'Api', webhook: true }],
  };
  // Defaulted public is not explicit public - the developer must acknowledge
  // the public transport by listing the endpoint in auth.api.public.
  expect(() => buildEntityAuth({ components, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});

test('buildEntityAuth api: throws when a webhook endpoint is protected by auth.api.protected true', () => {
  const components = {
    auth: {
      api: {
        protected: true,
        roles: {},
      },
    },
    api: [{ id: 'hook', type: 'Api', webhook: true }],
  };
  expect(() => buildEntityAuth({ components, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});

test('buildEntityAuth api: throws when a webhook endpoint is listed in auth.api.protected', () => {
  const components = {
    auth: {
      api: {
        protected: ['hook'],
        roles: {},
      },
    },
    api: [{ id: 'hook', type: 'Api', webhook: true }],
  };
  expect(() => buildEntityAuth({ components, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});

test('buildEntityAuth api: throws when a webhook endpoint is protected by roles', () => {
  const components = {
    auth: {
      api: {
        roles: {
          role1: ['hook'],
        },
      },
    },
    api: [{ id: 'hook', type: 'Api', webhook: true }],
  };
  expect(() => buildEntityAuth({ components, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});

test('buildEntityAuth api: a webhook endpoint explicitly listed in auth.api.public builds', () => {
  const components = {
    auth: {
      api: {
        public: ['hook'],
        roles: {},
      },
    },
    api: [{ id: 'hook', type: 'Api', webhook: true }],
  };
  const res = buildEntityAuth({ components, entity: 'api' });
  expect(res.api).toEqual([{ id: 'hook', type: 'Api', webhook: true, auth: { public: true } }]);
});

test('buildEntityAuth api: a webhook endpoint listed in auth.api.public builds under protected true', () => {
  const components = {
    auth: {
      api: {
        protected: true,
        public: ['hook'],
        roles: {},
      },
    },
    api: [
      { id: 'hook', type: 'Api', webhook: true },
      { id: 'ep1', type: 'Api' },
    ],
  };
  const res = buildEntityAuth({ components, entity: 'api' });
  expect(res.api).toEqual([
    { id: 'hook', type: 'Api', webhook: true, auth: { public: true } },
    { id: 'ep1', type: 'Api', auth: { public: false } },
  ]);
});

test('buildEntityAuth api: a webhook: { verify } object is accepted via truthiness and needs explicit public', () => {
  const verifying = {
    id: 'hook',
    type: 'Api',
    webhook: { verify: { type: 'VerifyGithubWebhook', properties: {} } },
  };
  const components = {
    auth: {
      api: {
        public: ['hook'],
        roles: {},
      },
    },
    api: [verifying],
  };
  const res = buildEntityAuth({ components, entity: 'api' });
  expect(res.api[0].auth).toEqual({ public: true });

  const implicit = {
    auth: { api: { roles: {} } },
    api: [{ id: 'hook', type: 'Api', webhook: { verify: { type: 'VerifyGithubWebhook' } } }],
  };
  expect(() => buildEntityAuth({ components: implicit, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});
