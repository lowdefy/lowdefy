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

import buildAuth from './buildAuth.js';
import testContext from '../../test-utils/testContext.js';

const validSecret = { _secret: 'BETTER_AUTH_SECRET' };
const validDatabase = { id: 'auth_db', type: 'MongoDBAuthAdapter', properties: {} };

test('buildAuth returns unconfigured defaults when auth is absent', () => {
  const context = testContext();
  const components = {
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
      { id: 'c', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      api: { roles: {} },
      websockets: { roles: {} },
      configured: false,
      pages: { roles: {} },
      pagesProtectedByDefault: false,
      providers: [],
      roles: [],
    },
    pages: [
      { id: 'a', type: 'Context', auth: { public: true } },
      { id: 'b', type: 'Context', auth: { public: true } },
      { id: 'c', type: 'Context', auth: { public: true } },
    ],
  });
});

test('buildAuth returns unconfigured defaults when there are no pages', () => {
  const context = testContext();
  const components = {};
  const res = buildAuth({ components, context });
  expect(res).toEqual({
    auth: {
      api: { roles: {} },
      websockets: { roles: {} },
      configured: false,
      pages: { roles: {} },
      pagesProtectedByDefault: false,
      providers: [],
      roles: [],
    },
  });
});

test('buildAuth throws when auth is configured without an authentication mechanism', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
    },
  };
  expect(() => buildAuth({ components, context })).toThrow(
    'Auth is configured without an authentication mechanism.'
  );
});

test('buildAuth marks all pages public by default for a minimal valid auth config', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res.auth.configured).toBe(true);
  expect(res.pages).toEqual([
    { id: 'a', type: 'Context', auth: { public: true } },
    { id: 'b', type: 'Context', auth: { public: true } },
  ]);
});

test('buildAuth fills in configured defaults for a minimal valid auth config', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
  };
  const res = buildAuth({ components, context });
  expect(res.auth).toEqual({
    secret: validSecret,
    database: validDatabase,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      disableSignUp: false,
    },
    configured: true,
    api: { roles: {} },
    websockets: { roles: {} },
    pages: { roles: {} },
    pagesProtectedByDefault: false,
    providers: [],
    roles: [],
    hooks: [],
    strategies: [],
    organizations: {
      policy: 'pinned',
      org: 'default',
      signup: 'invite-only',
    },
    authPages: {
      signIn: '/login',
      signUp: '/signup',
      error: '/auth/error',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      verifyEmail: '/verify-email',
    },
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      cookieCache: { enabled: false, maxAge: 300 },
      crossSubDomainCookies: { enabled: false },
    },
    account: {
      accountLinking: { enabled: true, trustedProviders: [] },
    },
    rateLimit: { enabled: true, window: 60, max: 100 },
  });
});

test('buildAuth marks all pages protected when auth.pages.protected is true', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        protected: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'b', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res.pages).toEqual([
    { id: 'a', type: 'Context', auth: { public: false } },
    { id: 'b', type: 'Context', auth: { public: false } },
  ]);
});

test('buildAuth 404 page is always public even when all pages are protected', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        protected: true,
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: '404', type: 'Result' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res.pages).toEqual([
    { id: 'a', type: 'Context', auth: { public: false } },
    { id: '404', type: 'Result', auth: { public: true } },
  ]);
});

test('buildAuth applies page roles on top of a protected/public configuration', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      roles: [{ id: 'role1' }, { id: 'role2' }],
      pages: {
        roles: {
          role1: ['page1'],
          role2: ['page1', 'page2'],
        },
      },
    },
    pages: [
      { id: 'page1', type: 'Context' },
      { id: 'page2', type: 'Context' },
      { id: 'page3', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res.pages).toEqual([
    { id: 'page1', type: 'Context', auth: { public: false, roles: ['role1', 'role2'] } },
    { id: 'page2', type: 'Context', auth: { public: false, roles: ['role2'] } },
    { id: 'page3', type: 'Context', auth: { public: true } },
  ]);
});

test('buildAuth throws when a page is both protected by roles and public', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      roles: [{ id: 'role1' }],
      pages: {
        roles: {
          role1: ['page1'],
        },
        public: ['page1'],
      },
    },
    pages: [{ id: 'page1', type: 'Context' }],
  };
  expect(() => buildAuth({ components, context })).toThrow(
    'Page "page1" is both protected by roles and public.'
  );
});

test('buildAuth translates account.accountLinking.trustedProviders', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      providers: [{ id: 'okta', type: 'GenericOAuth', properties: {} }],
      account: {
        accountLinking: {
          trustedProviders: ['emailAndPassword', 'okta'],
        },
      },
    },
  };
  const res = buildAuth({ components, context });
  expect(res.auth.account.accountLinking.trustedProviders).toEqual(['email-password', 'okta']);
});

test('buildAuth resolves pagesProtectedByDefault true when auth.pages.protected is true', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        protected: true,
      },
    },
    pages: [{ id: 'a', type: 'Context' }],
  };
  const res = buildAuth({ components, context });
  expect(res.auth.pagesProtectedByDefault).toBe(true);
});

test('buildAuth resolves pagesProtectedByDefault false when auth.pages.protected is a list', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
      pages: {
        protected: ['admin'],
      },
    },
    pages: [
      { id: 'a', type: 'Context' },
      { id: 'admin', type: 'Context' },
    ],
  };
  const res = buildAuth({ components, context });
  expect(res.auth.pagesProtectedByDefault).toBe(false);
});

test('buildAuth resolves pagesProtectedByDefault false when auth declares no pages', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      emailAndPassword: { enabled: true },
    },
    pages: [{ id: 'a', type: 'Context' }],
  };
  const res = buildAuth({ components, context });
  expect(res.auth.pagesProtectedByDefault).toBe(false);
});

test('buildAuth counts the database adapter and provider types', () => {
  const context = testContext();
  const components = {
    auth: {
      secret: validSecret,
      database: validDatabase,
      providers: [
        { id: 'okta', type: 'GenericOAuth', properties: {} },
        { id: 'google', type: 'Google', properties: {} },
      ],
    },
  };
  buildAuth({ components, context });
  expect(context.typeCounters.auth.adapters.getCounts()).toEqual({ MongoDBAuthAdapter: 1 });
  expect(context.typeCounters.auth.providers.getCounts()).toEqual({
    GenericOAuth: 1,
    Google: 1,
  });
});
