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

import getBetterAuthConfig from './getBetterAuthConfig.js';

// Matches the defaulted auth.json artifact shape written by the build.
function createAuthJson(overrides = {}) {
  return {
    configured: true,
    secret: { _secret: 'BETTER_AUTH_SECRET' },
    database: {
      id: 'auth_db',
      type: 'MongoDBAuthAdapter',
      properties: { uri: { _secret: 'AUTH_DB_URI' } },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      disableSignUp: false,
    },
    providers: [],
    session: {
      expiresIn: 604800,
      updateAge: 86400,
      cookieCache: { enabled: false, maxAge: 300 },
      crossSubDomainCookies: { enabled: false },
    },
    account: { accountLinking: { enabled: true, trustedProviders: [] } },
    rateLimit: { enabled: true, window: 60, max: 100 },
    authPages: {
      signIn: '/login',
      signUp: '/signup',
      error: '/auth/error',
      forgotPassword: '/forgot-password',
      resetPassword: '/reset-password',
      verifyEmail: '/verify-email',
    },
    api: { roles: {} },
    pages: { roles: {} },
    websockets: { roles: {} },
    organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
    roles: [],
    ...overrides,
  };
}

const appMeta = { name: 'Test App', slug: 'test-app' };

const getAuth = () => ({});

function createLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

function createPlugins(overrides = {}) {
  return {
    adapters: { MongoDBAuthAdapter: jest.fn(() => 'adapter-instance') },
    providers: {},
    ...overrides,
  };
}

const baseSecrets = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  AUTH_DB_URI: 'mongodb://localhost/test',
};

test('resolves secret via the _secret operator', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.secret).toBe(baseSecrets.BETTER_AUTH_SECRET);
});

test('throws ConfigError when secret does not resolve to a string', () => {
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: { AUTH_DB_URI: baseSecrets.AUTH_DB_URI },
    })
  ).toThrow(ConfigError);
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: { AUTH_DB_URI: baseSecrets.AUTH_DB_URI },
    })
  ).toThrow(
    'Auth "secret" did not resolve to a string. Check the _secret operator reference and that the secret is set.'
  );
});

test('throws the first operator error when an operator fails while resolving auth.json', () => {
  const authJson = createAuthJson({ secret: { _secret: { all: true } } });
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    })
  ).toThrow('Getting all secrets is not allowed.');
});

test('logs a warning when the resolved secret is shorter than 32 characters', () => {
  const logger = createLogger();
  getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger,
    plugins: createPlugins(),
    secrets: { ...baseSecrets, BETTER_AUTH_SECRET: 'short-secret' },
  });
  expect(logger.warn).toHaveBeenCalledWith(
    'Auth "secret" is shorter than 32 characters. Use a long random value, e.g. `openssl rand -base64 32`.'
  );
});

test('does not warn about a short secret when the resolved secret is 32 characters or longer', () => {
  const logger = createLogger();
  getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger,
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('shorter than 32'));
});

test('resolves the database adapter using the matching plugin and resolved secrets', () => {
  const adapterPlugin = jest.fn(() => 'adapter-instance');
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins({ adapters: { MongoDBAuthAdapter: adapterPlugin } }),
    secrets: baseSecrets,
  });
  expect(adapterPlugin).toHaveBeenCalledWith({ properties: { uri: baseSecrets.AUTH_DB_URI } });
  expect(options.database).toBe('adapter-instance');
});

test('throws ConfigError when the database adapter type is not found', () => {
  const authJson = createAuthJson({
    database: {
      id: 'auth_db',
      type: 'UnknownAdapter',
      properties: {},
      '~k': 'auth.database',
    },
  });
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    })
  ).toThrow(ConfigError);
  try {
    getBetterAuthConfig({
      appMeta,
      authJson,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
  } catch (e) {
    expect(e.message).toBe(
      'Auth database adapter type "UnknownAdapter" not found at database "auth_db".'
    );
    expect(e.configKey).toBe('auth.database');
  }
});

test('sets basePath to /api/auth when config.basePath is not set', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.basePath).toBe('/api/auth');
});

test('prefixes basePath with config.basePath when set', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    config: { basePath: '/my-app' },
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.basePath).toBe('/my-app/api/auth');
});

test('maps model names to the fixed user-* collection naming convention', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.user.modelName).toBe('users');
  expect(options.session.modelName).toBe('user-sessions');
  expect(options.account.modelName).toBe('user-accounts');
  expect(options.verification.modelName).toBe('user-verifications');
});

test('passes rateLimit config through unchanged', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ rateLimit: { enabled: false, window: 30, max: 10 } }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.rateLimit).toEqual({ enabled: false, window: 30, max: 10 });
});

test('passes session config through, including cookieCache', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      session: {
        expiresIn: 1000,
        updateAge: 100,
        cookieCache: { enabled: true, maxAge: 60 },
        crossSubDomainCookies: { enabled: false },
      },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.session.expiresIn).toBe(1000);
  expect(options.session.updateAge).toBe(100);
  expect(options.session.cookieCache).toEqual({ enabled: true, maxAge: 60 });
});

test('enables crossSubDomainCookies on advanced when configured', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      session: {
        expiresIn: 604800,
        updateAge: 86400,
        cookieCache: { enabled: false, maxAge: 300 },
        crossSubDomainCookies: { enabled: true, domain: '.example.com' },
      },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.advanced.crossSubDomainCookies).toEqual({
    enabled: true,
    domain: '.example.com',
  });
});

test('passes account accountLinking config through', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      account: { accountLinking: { enabled: false, trustedProviders: ['google'] } },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.account.accountLinking).toEqual({ enabled: false, trustedProviders: ['google'] });
});

test('adds emailAndPassword block when enabled, without sendResetPassword when email is not configured', () => {
  const logger = createLogger();
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger,
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.emailAndPassword).toMatchObject({
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    disableSignUp: false,
  });
  expect(options.emailAndPassword.sendResetPassword).toBeUndefined();
  expect(logger.warn).toHaveBeenCalledWith(
    'Auth "email" is not configured - password reset emails cannot be sent, so the reset flow is unavailable.'
  );
});

test('omits emailAndPassword block when not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      emailAndPassword: {
        enabled: false,
        requireEmailVerification: false,
        minPasswordLength: 8,
        disableSignUp: false,
      },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.emailAndPassword).toBeUndefined();
});

test('adds sendResetPassword and emailVerification when email is configured', () => {
  const logger = createLogger();
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      email: {
        from: 'noreply@example.com',
        provider: { properties: { host: 'smtp.example.com', port: 587 } },
      },
    }),
    getAuth,
    logger,
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(typeof options.emailAndPassword.sendResetPassword).toBe('function');
  expect(typeof options.emailVerification.sendVerificationEmail).toBe('function');
  expect(logger.warn).not.toHaveBeenCalledWith(
    expect.stringContaining('password reset emails cannot be sent')
  );
});

test('does not add emailVerification when email is not configured', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.emailVerification).toBeUndefined();
});

test('sets socialProviders only when at least one built-in provider is configured', () => {
  function Google({ properties }) {
    return { kind: 'social', provider: 'google', options: properties };
  }
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      providers: [{ id: 'google', type: 'Google', properties: { clientId: 'cid' } }],
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins({ providers: { Google } }),
    secrets: baseSecrets,
  });
  expect(options.socialProviders).toEqual({ google: { clientId: 'cid' } });
});

test('omits socialProviders when no built-in providers are configured', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.socialProviders).toBeUndefined();
});

test('pushes the generic-oauth plugin when a GenericOAuth provider is configured', () => {
  function GenericOAuthProvider({ id, properties }) {
    return { kind: 'generic', config: { providerId: id, ...properties } };
  }
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      providers: [{ id: 'okta', type: 'GenericOAuthProvider', properties: { clientId: 'cid' } }],
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins({ providers: { GenericOAuthProvider } }),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'generic-oauth')).toBe(true);
});

test('does not push the generic-oauth plugin when no GenericOAuth provider is configured', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'generic-oauth')).toBe(false);
});

test('pushes the magic-link plugin when magicLink is enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      email: {
        from: 'noreply@example.com',
        provider: { properties: { host: 'smtp.example.com', port: 587 } },
      },
      magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'magic-link')).toBe(true);
});

test('does not push the magic-link plugin when magicLink is not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'magic-link')).toBe(false);
});

test('pushes the two-factor plugin when twoFactor is enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ twoFactor: { enabled: true } }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'two-factor')).toBe(true);
});

test('does not push the two-factor plugin when twoFactor is not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'two-factor')).toBe(false);
});

test('pushes the passkey plugin when passkey is enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      passkey: { enabled: true, rpId: 'example.com', rpName: 'Test App' },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'passkey')).toBe(true);
});

test('does not push the passkey plugin when passkey is not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'passkey')).toBe(false);
});

test('always pushes the admin plugin', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'admin')).toBe(true);
});

test('sets cookie prefix via resolveCookiePrefix, using the app slug in dev', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    dev: true,
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.advanced.cookiePrefix).toBe('lowdefy-test-app');
});

test('sets cookie prefix to lowdefy in production', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    dev: false,
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.advanced.cookiePrefix).toBe('lowdefy');
});

test('assembles databaseHooks from auth.hooks bindings', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      hooks: [
        { id: 'normalize', point: 'user.create.before', endpointId: 'auth/normalize' },
        { id: 'audit', point: 'session.create.after', endpointId: 'auth/audit' },
      ],
    }),
    createSystemContext: jest.fn(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.databaseHooks.user.create.before).toBeInstanceOf(Function);
  expect(options.databaseHooks.session.create.after).toBeInstanceOf(Function);
  expect(options.emailVerification?.afterEmailVerification).toBeUndefined();
});

test('always sets the engine session.create.before policy slot even with no user hooks', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ hooks: [] }),
    createSystemContext: jest.fn(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.databaseHooks.session.create.before).toBeInstanceOf(Function);
  expect(options.databaseHooks.user).toBeUndefined();
});

test('an email.verified hook sets emailVerification.afterEmailVerification and preserves sendVerificationEmail', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      email: {
        from: 'noreply@example.com',
        provider: { type: 'smtp', properties: { host: 'localhost', port: 1025 } },
      },
      hooks: [{ id: 'on-verified', point: 'email.verified', endpointId: 'auth/on-verified' }],
    }),
    createSystemContext: jest.fn(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.emailVerification.afterEmailVerification).toBeInstanceOf(Function);
  expect(options.emailVerification.sendVerificationEmail).toBeInstanceOf(Function);
  expect(options.databaseHooks.user).toBeUndefined();
});

test('always pushes the organization plugin', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'organization')).toBe(true);
});

test('registers the internal user additionalFields (contactId, attributes)', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.user.additionalFields).toEqual({
    contactId: { type: 'string', required: false, input: false },
    attributes: { type: 'json', required: false, input: false },
  });
});

test('throws when no getAuth accessor is provided', () => {
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    })
  ).toThrow('No getAuth accessor was provided to getBetterAuthConfig');
});
