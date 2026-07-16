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

import buildModuleAuth from './buildModuleAuth.js';

function makeContext(modules) {
  const context = { modules: {}, logger: { info: jest.fn(), warn: jest.fn() } };
  for (const mod of modules) {
    context.modules[mod.id] = mod;
  }
  return context;
}

// A minimal configured auth block - isAuthConfigured only checks the block
// is present and non-empty.
function configuredAuth(auth = {}) {
  return { emailAndPassword: { enabled: true }, ...auth };
}

test('buildModuleAuth contributes hook bindings with scoped ids before the app entries', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: {
          hooks: [{ point: 'user.create.before', endpoint: 'link-contact-on-signup' }],
        },
      },
    },
  ]);
  const components = {
    auth: configuredAuth({
      hooks: [{ id: 'app-hook', point: 'user.create.before', endpointId: 'auth/app-hook' }],
    }),
  };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.hooks).toEqual([
    {
      id: 'crm/link-contact-on-signup:user.create.before',
      point: 'user.create.before',
      endpointId: 'crm/link-contact-on-signup',
    },
    { id: 'app-hook', point: 'user.create.before', endpointId: 'auth/app-hook' },
  ]);
});

test('buildModuleAuth creates auth.hooks when the app has none', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: {
          hooks: [
            { point: 'user.create.before', endpoint: 'link-contact' },
            { point: 'email.verified', endpoint: 'link-contact' },
          ],
        },
      },
    },
  ]);
  const components = { auth: configuredAuth() };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.hooks).toEqual([
    {
      id: 'crm/link-contact:user.create.before',
      point: 'user.create.before',
      endpointId: 'crm/link-contact',
    },
    {
      id: 'crm/link-contact:email.verified',
      point: 'email.verified',
      endpointId: 'crm/link-contact',
    },
  ]);
});

test('buildModuleAuth orders hook contributions by module-entry declaration order', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: { hooks: [{ point: 'user.create.before', endpoint: 'link-contact' }] },
      },
    },
    {
      id: 'user-admin',
      manifest: {
        auth: { hooks: [{ point: 'email.verified', endpoint: 'welcome-user' }] },
      },
    },
  ]);
  const components = {
    auth: configuredAuth({
      hooks: [{ id: 'app-audit', point: 'session.create.after', endpointId: 'auth/audit' }],
    }),
  };
  buildModuleAuth({
    components,
    context,
    moduleEntries: [{ id: 'crm' }, { id: 'user-admin' }],
  });
  expect(components.auth.hooks.map((hook) => hook.id)).toEqual([
    'crm/link-contact:user.create.before',
    'user-admin/welcome-user:email.verified',
    'app-audit',
  ]);
});

test('buildModuleAuth fills an unclaimed authPages role with the scoped page path', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: { pages: { signIn: 'login', signUp: 'signup' } },
      },
    },
  ]);
  const components = { auth: configuredAuth() };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.authPages).toEqual({
    signIn: '/crm/login',
    signUp: '/crm/signup',
  });
});

test('buildModuleAuth keeps the app authPages value when the app sets the role', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: { pages: { signIn: 'login', signUp: 'signup' } },
      },
    },
  ]);
  const components = {
    auth: configuredAuth({ authPages: { signIn: '/my-login' } }),
  };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.authPages).toEqual({
    signIn: '/my-login',
    signUp: '/crm/signup',
  });
});

test('buildModuleAuth throws when two modules claim the same authPages role with no app override', () => {
  const context = makeContext([
    { id: 'crm', manifest: { auth: { pages: { signIn: 'login' } } } },
    { id: 'user-admin', manifest: { auth: { pages: { signIn: 'sign-in' } } } },
  ]);
  const components = { auth: configuredAuth() };
  expect(() =>
    buildModuleAuth({
      components,
      context,
      moduleEntries: [{ id: 'crm' }, { id: 'user-admin' }],
    })
  ).toThrow(
    'Modules "crm" and "user-admin" both claim authPages role "signIn" and the app does not set it. Set "auth.authPages.signIn" in the app to choose one.'
  );
});

test('buildModuleAuth allows two modules claiming the same role when the app overrides it', () => {
  const context = makeContext([
    { id: 'crm', manifest: { auth: { pages: { signIn: 'login' } } } },
    { id: 'user-admin', manifest: { auth: { pages: { signIn: 'sign-in' } } } },
  ]);
  const components = {
    auth: configuredAuth({ authPages: { signIn: '/my-login' } }),
  };
  buildModuleAuth({
    components,
    context,
    moduleEntries: [{ id: 'crm' }, { id: 'user-admin' }],
  });
  expect(components.auth.authPages).toEqual({ signIn: '/my-login' });
});

test('buildModuleAuth unions scoped public pages into an app public list', () => {
  const context = makeContext([
    { id: 'crm', manifest: { auth: { public: ['accept-invitation'] } } },
  ]);
  const components = {
    auth: configuredAuth({ pages: { public: ['home'] } }),
  };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.pages.public).toEqual(['home', 'crm/accept-invitation']);
  expect(context.moduleAuthPublicPages).toEqual(['crm/accept-invitation']);
});

test('buildModuleAuth records public pages on the context when the app uses protected mode', () => {
  const context = makeContext([
    { id: 'crm', manifest: { auth: { public: ['accept-invitation'] } } },
  ]);
  const components = {
    auth: configuredAuth({ pages: { protected: true } }),
  };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.pages).toEqual({ protected: true });
  expect(context.moduleAuthPublicPages).toEqual(['crm/accept-invitation']);
});

test('buildModuleAuth public contributions are no-ops under public true', () => {
  const context = makeContext([
    { id: 'crm', manifest: { auth: { public: ['accept-invitation'] } } },
  ]);
  const components = {
    auth: configuredAuth({ pages: { public: true } }),
  };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components.auth.pages).toEqual({ public: true });
});

test('buildModuleAuth logs each contributed entry with its origin module and target key', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: {
          hooks: [{ point: 'user.create.before', endpoint: 'link-contact' }],
          pages: { signIn: 'login' },
          public: ['accept-invitation'],
        },
      },
    },
  ]);
  const components = { auth: configuredAuth() };
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(context.logger.info.mock.calls.map((call) => call[0])).toEqual([
    'Module "crm" contributed auth hook "crm/link-contact:user.create.before" to "auth.hooks" binding point "user.create.before" to endpoint "crm/link-contact".',
    'Module "crm" contributed "/crm/login" to "auth.authPages.signIn".',
    'Module "crm" contributed public page "crm/accept-invitation" to "auth.pages.public".',
  ]);
});

test('buildModuleAuth skips contribution when the app has no auth configured', () => {
  const context = makeContext([
    {
      id: 'crm',
      manifest: {
        auth: {
          hooks: [{ point: 'user.create.before', endpoint: 'link-contact' }],
          pages: { signIn: 'login' },
          public: ['accept-invitation'],
        },
      },
    },
  ]);
  const components = {};
  buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(components).toEqual({});
  expect(context.moduleAuthPublicPages).toBe(undefined);
});

test('buildModuleAuth returns components unchanged when no module declares auth', () => {
  const context = makeContext([{ id: 'crm', manifest: { pages: [{ id: 'login' }] } }]);
  const components = { auth: configuredAuth() };
  const res = buildModuleAuth({ components, context, moduleEntries: [{ id: 'crm' }] });
  expect(res).toBe(components);
  expect(components.auth.hooks).toBe(undefined);
  expect(components.auth.authPages).toBe(undefined);
});
