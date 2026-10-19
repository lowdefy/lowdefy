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

// Each page served at its id, as buildRoutes sets the route table.
function routesContext(components) {
  return { routes: (components.pages ?? []).map((page) => ({ pageId: page.id, path: page.id })) };
}

test('buildEntityAuth websockets: returns components when no websockets defined', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
  };
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'websockets' })).toThrow(
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
  const res = buildEntityAuth({ components, context: {}, entity: 'websockets' });
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
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
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
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
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
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
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
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'login', type: 'Context', auth: { public: true } },
    { id: 'dashboard', type: 'Context', auth: { public: false } },
  ]);
});

test('buildEntityAuth pages: the page holding twoFactorEnrol is protected under protected true', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        twoFactorEnrol: '/two-factor-enrol',
      },
      pages: {
        protected: true,
        roles: {},
      },
    },
    pages: [
      { id: 'login', type: 'Context' },
      { id: 'two-factor-enrol', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'login', type: 'Context', auth: { public: true } },
    { id: 'two-factor-enrol', type: 'Context', auth: { public: false } },
  ]);
});

test('buildEntityAuth pages: the page holding twoFactorEnrol is protected under a public list', () => {
  const components = {
    auth: {
      authPages: {
        signIn: '/login',
        twoFactorEnrol: '/two-factor-enrol',
      },
      pages: {
        public: ['home'],
        roles: {},
      },
    },
    pages: [
      { id: 'home', type: 'Context' },
      { id: 'login', type: 'Context' },
      { id: 'two-factor-enrol', type: 'Context' },
    ],
  };
  const res = buildEntityAuth({ components, context: routesContext(components), entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'home', type: 'Context', auth: { public: true } },
    { id: 'login', type: 'Context', auth: { public: true } },
    { id: 'two-factor-enrol', type: 'Context', auth: { public: false } },
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
  const context = {
    ...routesContext(components),
    moduleAuthPublicPages: ['crm/accept-invitation'],
  };
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
  const context = {
    ...routesContext(components),
    moduleAuthPublicPages: ['crm/accept-invitation'],
  };
  const res = buildEntityAuth({ components, context, entity: 'pages' });
  expect(res.pages).toEqual([
    { id: 'crm/accept-invitation', type: 'Context', auth: { public: true } },
    { id: 'dashboard', type: 'Context', auth: { public: false } },
  ]);
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'api' })).toThrow(
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'api' })).toThrow(
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'api' })).toThrow(
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'api' })).toThrow(
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
  expect(() => buildEntityAuth({ components, context: {}, entity: 'api' })).toThrow(
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
  const res = buildEntityAuth({ components, context: {}, entity: 'api' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'api' });
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
  const res = buildEntityAuth({ components, context: {}, entity: 'api' });
  expect(res.api[0].auth).toEqual({ public: true });

  const implicit = {
    auth: { api: { roles: {} } },
    api: [{ id: 'hook', type: 'Api', webhook: { verify: { type: 'VerifyGithubWebhook' } } }],
  };
  expect(() => buildEntityAuth({ components: implicit, context: {}, entity: 'api' })).toThrow(
    'Endpoint "hook" is a webhook receiver and must be declared explicitly public'
  );
});

// buildAuth runs before buildApi, buildWebsockets and buildPages, so validateId
// has not seen these ids when buildEntityAuth keys its plain-object maps by
// them. The two tests below pin both ways a reserved id used to get through.
test('buildEntityAuth pages: a reserved page id with a roles gate throws a located ConfigError instead of crashing getEntityRoles', () => {
  const components = {
    auth: {
      pages: {
        roles: {
          admin: ['*'],
        },
      },
    },
    pages: [{ id: '__proto__', '~k': 'page-key', type: 'Box' }],
  };
  let thrown;
  try {
    buildEntityAuth({ components, entity: 'pages' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown.name).toBe('ConfigError');
  expect(thrown.message).toBe(
    'Page id "__proto__" is a reserved name and cannot be used as an id.'
  );
  expect(thrown.configKey).toBe('page-key');
});

test('buildEntityAuth api: a reserved endpoint id with no roles configured throws instead of building a protected auth artifact', () => {
  const components = {
    auth: {
      api: {
        roles: {},
      },
    },
    api: [{ id: 'constructor', '~k': 'endpoint-key', type: 'Api' }],
  };
  let thrown;
  try {
    buildEntityAuth({ components, context: {}, entity: 'api' });
  } catch (error) {
    thrown = error;
  }
  expect(thrown.name).toBe('ConfigError');
  expect(thrown.message).toBe(
    'Endpoint id "constructor" is a reserved name and cannot be used as an id.'
  );
  expect(thrown.configKey).toBe('endpoint-key');
  expect(components.api[0].auth).toBe(undefined);
});

test('buildEntityAuth websockets: a reserved websocket id throws a located ConfigError', () => {
  const components = {
    auth: {
      websockets: {
        roles: {},
      },
    },
    websockets: [{ id: 'prototype', '~k': 'ws-key', type: 'Channel' }],
  };
  expect(() => buildEntityAuth({ components, context: {}, entity: 'websockets' })).toThrow(
    'Websocket id "prototype" is a reserved name and cannot be used as an id.'
  );
});

describe.each([
  ['api', 'endpoint', 'ticker', 'Api'],
  ['websockets', 'websocket', 'ticker', 'Channel'],
])('buildEntityAuth %s from a module', (entity, label, appId, itemType) => {
  const moduleId = 'support/thread-messages';

  function moduleComponents(entityAuth) {
    return {
      auth: {
        configured: true,
        [entity]: { roles: {}, ...entityAuth },
      },
      [entity]: [
        { id: appId, type: itemType },
        { id: moduleId, type: itemType },
      ],
    };
  }

  function moduleContext({ declaredPublic = [] } = {}) {
    return {
      moduleEntityIds: { [entity]: [moduleId] },
      moduleAuthPublicEntities: { [entity]: declaredPublic },
    };
  }

  function resolvedAuth(components) {
    return components[entity].map((item) => item.auth);
  }

  test(`a module ${label} is protected when auth is configured and the app sets no rule`, () => {
    const components = moduleComponents({});
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: false }]);
  });

  test(`a module ${label} a protected list does not name stays protected`, () => {
    const components = moduleComponents({ protected: [appId] });
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: false }]);
  });

  test(`app public true makes a module ${label} public`, () => {
    const components = moduleComponents({ public: true });
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: true }]);
  });

  test(`an app public list naming a module ${label} makes it public`, () => {
    const components = moduleComponents({ public: ['support/**'] });
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: true }]);
  });

  test(`app roles on a module ${label} apply as for an app ${label}`, () => {
    const components = moduleComponents({ roles: { agent: ['support/**'] } });
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(components[entity][1].auth).toEqual({ public: false, roles: ['agent'] });
  });

  test(`a module-declared public ${label} is public with no app rule`, () => {
    const components = moduleComponents({});
    buildEntityAuth({
      components,
      context: moduleContext({ declaredPublic: [moduleId] }),
      entity,
    });
    expect(components[entity][1].auth).toEqual({ public: true });
  });

  test(`a module-declared public ${label} stays public under protected true`, () => {
    const components = moduleComponents({ protected: true });
    buildEntityAuth({
      components,
      context: moduleContext({ declaredPublic: [moduleId] }),
      entity,
    });
    expect(resolvedAuth(components)).toEqual([{ public: false }, { public: true }]);
  });

  test(`a module ${label} follows the app rules when auth is not configured`, () => {
    const components = moduleComponents({});
    components.auth.configured = false;
    buildEntityAuth({ components, context: moduleContext(), entity });
    expect(resolvedAuth(components)).toEqual([{ public: true }, { public: true }]);
  });
});

test('buildEntityAuth api: a module webhook endpoint the module declares public still needs the app public list', () => {
  const components = {
    auth: { configured: true, api: { roles: {} } },
    api: [{ id: 'billing/stripe-events', type: 'Api', webhook: true }],
  };
  expect(() =>
    buildEntityAuth({
      components,
      context: {
        moduleEntityIds: { api: ['billing/stripe-events'] },
        moduleAuthPublicEntities: { api: ['billing/stripe-events'] },
      },
      entity: 'api',
    })
  ).toThrow(
    'Endpoint "billing/stripe-events" is a webhook receiver and must be declared explicitly public'
  );
});

test('buildEntityAuth pages: module endpoint and websocket ids leave pages untouched', () => {
  const components = {
    auth: { configured: true, pages: { roles: {} } },
    pages: [{ id: 'support/inbox', type: 'Box' }],
  };
  buildEntityAuth({
    components,
    context: {
      ...routesContext(components),
      moduleEntityIds: { api: ['support/inbox'], websockets: ['support/inbox'] },
    },
    entity: 'pages',
  });
  expect(components.pages[0].auth).toEqual({ public: true });
});
