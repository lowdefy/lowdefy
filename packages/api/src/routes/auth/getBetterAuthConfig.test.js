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

const mockSendEmail = jest.fn(async () => ({ messageId: 'msg_1' }));
const mockCreateSendEmail = jest.fn(() => mockSendEmail);
const mockRenderAuthEmail = jest.fn(async () => ({
  subject: 'Rendered subject',
  html: '<p>Rendered</p>',
  text: 'Rendered text',
}));

jest.unstable_mockModule('./createSendEmail.js', () => ({ default: mockCreateSendEmail }));
jest.unstable_mockModule('../../email/renderAuthEmail.js', () => ({
  default: mockRenderAuthEmail,
}));

// The challenge sequence walks endpoint-context internals a plain object cannot
// supply, and has its own test; stub it so the two-factor interception's wiring
// can be driven with a fake context.
const mockBeginTwoFactorChallenge = jest.fn(async () => 'challenged');
jest.unstable_mockModule('./requestHooks/beginTwoFactorChallenge.js', () => ({
  default: mockBeginTwoFactorChallenge,
}));

const { default: getBetterAuthConfig } = await import('./getBetterAuthConfig.js');

const emailConfig = {
  connectionId: 'auth_email',
};

beforeEach(() => {
  mockSendEmail.mockClear();
  mockCreateSendEmail.mockClear();
  mockRenderAuthEmail.mockClear();
});

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

describe('base URL resolution', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

  afterEach(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  test('pins baseURL to BETTER_AUTH_URL when it is set', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const logger = createLogger();
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger,
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.baseURL).toBe('https://app.example.com');
    expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('base URL is not pinned'));
  });

  test('trims surrounding whitespace from BETTER_AUTH_URL', () => {
    process.env.BETTER_AUTH_URL = '  https://app.example.com  ';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.baseURL).toBe('https://app.example.com');
  });

  test('falls back to per-request host derivation and warns in production when BETTER_AUTH_URL is unset', () => {
    delete process.env.BETTER_AUTH_URL;
    const logger = createLogger();
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger,
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.baseURL).toEqual({ allowedHosts: ['*'], protocol: 'auto' });
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('base URL is not pinned'));
  });

  test('does not warn about an unpinned base URL in dev and uses the http protocol', () => {
    delete process.env.BETTER_AUTH_URL;
    const logger = createLogger();
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      dev: true,
      getAuth,
      logger,
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.baseURL).toEqual({ allowedHosts: ['*'], protocol: 'http' });
    expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining('base URL is not pinned'));
  });
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

test('constructs a stateless instance without a database for a strategies-only app', () => {
  const adapterPlugin = jest.fn(() => 'adapter-instance');
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      database: undefined,
      emailAndPassword: undefined,
      strategies: [
        {
          id: 'partner-access',
          type: 'apiKey',
          properties: { headerName: 'X-API-Key', keys: [{ id: 'acme', value: 'k'.repeat(32) }] },
          roles: ['partner'],
          attributes: {},
        },
      ],
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins({ adapters: { MongoDBAuthAdapter: adapterPlugin } }),
    secrets: baseSecrets,
  });
  expect(adapterPlugin).not.toHaveBeenCalled();
  expect(options.database).toBeUndefined();
  expect(options.secret).toBe(baseSecrets.BETTER_AUTH_SECRET);
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
        connectionId: 'auth_email',
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

describe('auth email flows route through renderAuthEmail and sendEmail', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;
  const sentinelContext = { system: true };
  const createSystemContext = jest.fn(() => sentinelContext);

  afterEach(() => {
    createSystemContext.mockClear();
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  function getInvitationSender(options) {
    return options.plugins.find((p) => p.id === 'organization').options.sendInvitationEmail;
  }

  test('constructs sendEmail from the resolved auth.email.connectionId', () => {
    getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({ email: emailConfig }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(mockCreateSendEmail).toHaveBeenCalledWith({ connectionId: 'auth_email' });
  });

  test('sendResetPassword renders the resetPassword flow and sends to the user email', async () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({ email: emailConfig }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await options.emailAndPassword.sendResetPassword({
      user: { email: 'user@example.com' },
      url: 'https://app.example.com/reset?token=abc',
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'resetPassword',
        vars: { url: 'https://app.example.com/reset?token=abc' },
        authEmailConfig: expect.objectContaining({ connectionId: 'auth_email' }),
        context: sentinelContext,
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Rendered subject',
      html: '<p>Rendered</p>',
      text: 'Rendered text',
      context: sentinelContext,
    });
  });

  test('sendVerificationEmail renders the verifyEmail flow and sends to the user email', async () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({ email: emailConfig }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await options.emailVerification.sendVerificationEmail({
      user: { email: 'user@example.com' },
      url: 'https://app.example.com/verify?token=xyz',
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'verifyEmail',
        vars: { url: 'https://app.example.com/verify?token=xyz' },
        context: sentinelContext,
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', context: sentinelContext })
    );
  });

  test('sendMagicLink renders the magicLink flow and sends to the provided email', async () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        email: emailConfig,
        magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
      }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    const magicPlugin = options.plugins.find((p) => p.id === 'magic-link');
    await magicPlugin.options.sendMagicLink({
      email: 'user@example.com',
      url: 'https://app.example.com/magic?token=mmm',
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'magicLink',
        vars: { url: 'https://app.example.com/magic?token=mmm' },
        context: sentinelContext,
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'user@example.com', context: sentinelContext })
    );
  });

  test('the invitation sender composes the accept URL when origin and acceptInvitation are set', async () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        email: emailConfig,
        authPages: { acceptInvitation: '/accept-invitation' },
      }),
      config: { basePath: '/my-app' },
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await getInvitationSender(options)({
      email: 'invitee@example.com',
      organization: { name: 'Acme' },
      invitation: { id: 'inv_1' },
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'invitation',
        vars: {
          url: 'https://app.example.com/my-app/accept-invitation?invitationId=inv_1',
          organizationName: 'Acme',
          invitationId: 'inv_1',
        },
        context: sentinelContext,
      })
    );
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'invitee@example.com', context: sentinelContext })
    );
  });

  test('the invitation sender falls back to url undefined when the origin is not pinned', async () => {
    delete process.env.BETTER_AUTH_URL;
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        email: emailConfig,
        authPages: { acceptInvitation: '/accept-invitation' },
      }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await getInvitationSender(options)({
      email: 'invitee@example.com',
      organization: { name: 'Acme' },
      invitation: { id: 'inv_1' },
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        flow: 'invitation',
        vars: { url: undefined, organizationName: 'Acme', invitationId: 'inv_1' },
      })
    );
  });

  test('the invitation sender falls back to url undefined when acceptInvitation is not set', async () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({ email: emailConfig }),
      createSystemContext,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await getInvitationSender(options)({
      email: 'invitee@example.com',
      organization: { name: 'Acme' },
      invitation: { id: 'inv_1' },
    });
    expect(mockRenderAuthEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        vars: { url: undefined, organizationName: 'Acme', invitationId: 'inv_1' },
      })
    );
  });

  test('the invitation sender throws a configure-auth.email error when auth.email is unset', async () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    await expect(
      getInvitationSender(options)({
        email: 'invitee@example.com',
        organization: { name: 'Acme' },
        invitation: { id: 'inv_1' },
      })
    ).rejects.toThrow('Cannot send the invitation email. Configure "auth.email".');
    expect(mockRenderAuthEmail).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
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
        connectionId: 'auth_email',
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

test('instantiates the two-factor plugin with allowPasswordless, relaxing the enable body', () => {
  // allowPasswordless has no `.options` surface on the plugin object; its
  // in-repo-observable effect is that the enable endpoint accepts a body with
  // no password. Dropping the flag makes an empty body fail to parse, so this
  // pins the flag being wired. twoFactorPluginContract.test.js pins the
  // upstream contract this relies on.
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ twoFactor: { enabled: true } }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  const twoFactorPlugin = options.plugins.find((p) => p.id === 'two-factor');
  expect(twoFactorPlugin.endpoints.enableTwoFactor.options.body.safeParse({}).success).toBe(true);
});

test('leaves trustDeviceMaxAge unset so the plugin default applies when trustDevice is not disabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ twoFactor: { enabled: true } }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  const twoFactorPlugin = options.plugins.find((p) => p.id === 'two-factor');
  expect(twoFactorPlugin.options.trustDeviceMaxAge).toBeUndefined();
});

test('passes trustDeviceMaxAge 0 to the two-factor plugin when trustDevice is false', () => {
  // 0 disables trust-device authoritatively: every trust record is minted
  // already expired and its cookie as a browser delete, so no device is durably
  // trusted and a forged trustDevice: true cannot bypass.
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({ twoFactor: { enabled: true, trustDevice: false } }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  const twoFactorPlugin = options.plugins.find((p) => p.id === 'two-factor');
  expect(twoFactorPlugin.options.trustDeviceMaxAge).toBe(0);
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

test('always pushes the admin plugin, with no custom access control', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  const adminPlugin = options.plugins.find((p) => p.id === 'admin');
  expect(adminPlugin).toBeDefined();
  // admin() called with no options - BetterAuth's default roles apply.
  expect(adminPlugin.options).toBeUndefined();
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

test('sets function-form advanced.database.generateId that returns a plain UUID string', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  // Decision 7: a function keeps the adapter off its ObjectId/UUID-binary
  // coercion paths, so the stored id is a plain UUID string.
  expect(typeof options.advanced.database.generateId).toBe('function');
  const id = options.advanced.database.generateId();
  expect(typeof id).toBe('string');
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
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

test('always sets the engine session.create.before and user.create.before slots even with no user hooks', () => {
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
  // The engine-tier admission gate (Decision 2) always binds user.create.before.
  expect(options.databaseHooks.user.create.before).toBeInstanceOf(Function);
});

test('an email.verified hook sets emailVerification.afterEmailVerification and preserves sendVerificationEmail', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      email: {
        connectionId: 'auth_email',
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
  // email.verified is synthetic - it never binds a user database operation.
  expect(options.databaseHooks.user.create.after).toBeUndefined();
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

describe('policy-aware org client endpoint lockdown (disabledPaths)', () => {
  const adminPaths = [
    '/admin/set-role',
    '/admin/get-user',
    '/admin/create-user',
    '/admin/update-user',
    '/admin/list-users',
    '/admin/list-user-sessions',
    '/admin/unban-user',
    '/admin/ban-user',
    '/admin/impersonate-user',
    '/admin/stop-impersonating',
    '/admin/revoke-user-session',
    '/admin/revoke-user-sessions',
    '/admin/remove-user',
    '/admin/set-user-password',
    '/admin/has-permission',
  ];
  const mutationPaths = [
    '/organization/set-active',
    '/organization/update',
    '/organization/delete',
    '/organization/leave',
    '/organization/update-member-role',
    '/organization/remove-member',
    '/organization/invite-member',
    '/organization/cancel-invitation',
  ];
  const readPaths = [
    '/organization/list-members',
    '/organization/get-active-member',
    '/organization/get-active-member-role',
    '/organization/get-full-organization',
    '/organization/get-organization',
    '/organization/list',
    '/organization/get-invitation',
    '/organization/list-invitations',
    '/organization/list-user-invitations',
    '/organization/check-slug',
    '/organization/reject-invitation',
    '/organization/has-permission',
  ];

  test('under pinned policy, disables every mutation and read org path plus the admin surface', () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
      }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    [...adminPaths, ...mutationPaths, ...readPaths].forEach((path) => {
      expect(options.disabledPaths).toContain(path);
    });
  });

  test('under pinned policy, does not disable accept-invitation or create', () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        organizations: { policy: 'pinned', org: 'default', signup: 'invite-only' },
      }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.disabledPaths).not.toContain('/organization/accept-invitation');
    expect(options.disabledPaths).not.toContain('/organization/create');
  });

  test('defaults to the pinned disabled set when organizations.policy is absent', () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({ organizations: { org: 'default', signup: 'invite-only' } }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.disabledPaths).toContain('/organization/set-active');
    expect(options.disabledPaths).not.toContain('/organization/accept-invitation');
  });

  test('under tenant policy, disables the whole admin surface and no org endpoint', () => {
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        organizations: { policy: 'tenant', org: 'default', signup: 'invite-only' },
      }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.disabledPaths).toEqual(adminPaths);
    [...mutationPaths, ...readPaths].forEach((path) => {
      expect(options.disabledPaths).not.toContain(path);
    });
  });

  // The impersonation endpoints carried a carve-out while client actions drove
  // them; nothing drives them now, and no caller can pass their check.
  test.each(['pinned', 'tenant'])(
    'under %s policy, disables both impersonation endpoints',
    (policy) => {
      const options = getBetterAuthConfig({
        appMeta,
        authJson: createAuthJson({
          organizations: { policy, org: 'default', signup: 'invite-only' },
        }),
        getAuth,
        logger: createLogger(),
        plugins: createPlugins(),
        secrets: baseSecrets,
      });
      expect(options.disabledPaths).toContain('/admin/impersonate-user');
      expect(options.disabledPaths).toContain('/admin/stop-impersonating');
    }
  );
});

test('registers the internal user additionalFields (attributes, profile, contactId)', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.user.additionalFields).toEqual({
    attributes: { type: 'json', required: false, input: false },
    profile: { type: 'json', required: false, input: false },
    contactId: { type: 'string', required: false, input: false },
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

test('pushes the phone-number plugin when phoneNumber is enabled, wiring the phone.otp.send slot', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      phoneNumber: {
        enabled: true,
        otpLength: 6,
        expiresIn: 300,
        allowedAttempts: 3,
        requireVerification: false,
      },
      hooks: [{ id: 'send-otp-sms', point: 'phone.otp.send', endpointId: 'auth/send-otp-sms' }],
    }),
    createSystemContext: () => ({}),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  const phonePlugin = options.plugins.find((p) => p.id === 'phone-number');
  expect(phonePlugin).toBeDefined();
  expect(typeof phonePlugin.options.sendOTP).toBe('function');
  // Unbound phone.passwordReset.send resolves to the naming thrower, never
  // BetterAuth's silent 200.
  expect(() =>
    phonePlugin.options.sendPasswordResetOTP({ phoneNumber: '+27831234567', code: '123456' })
  ).toThrow('phone.passwordReset.send');
});

test('does not push the phone-number plugin when phoneNumber is not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'phone-number')).toBe(false);
});

test('pushes the captcha plugin when captcha is enabled, resolving secretKey via _secret', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      captcha: {
        enabled: true,
        provider: 'cloudflare-turnstile',
        siteKey: '0x4AAAAAAA',
        secretKey: { _secret: 'TURNSTILE_SECRET_KEY' },
      },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: { ...baseSecrets, TURNSTILE_SECRET_KEY: 'turnstile-secret-value' },
  });
  const captchaPlugin = options.plugins.find((p) => p.id === 'captcha');
  expect(captchaPlugin).toBeDefined();
  expect(captchaPlugin.options.secretKey).toBe('turnstile-secret-value');
  expect(captchaPlugin.options.endpoints).toEqual([
    '/sign-up/email',
    '/sign-in/email',
    '/request-password-reset',
    '/send-verification-email',
  ]);
});

test('throws ConfigError when captcha.secretKey does not resolve to a string', () => {
  expect(() =>
    getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        captcha: {
          enabled: true,
          provider: 'cloudflare-turnstile',
          siteKey: '0x4AAAAAAA',
          secretKey: null,
        },
      }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    })
  ).toThrow('Auth "captcha.secretKey" did not resolve to a string.');
});

test('does not push the captcha plugin when captcha is not enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(options.plugins.some((p) => p.id === 'captcha')).toBe(false);
});

describe('onAPIError.errorURL default landing page (Decision 5)', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

  afterEach(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  test('sets an absolute errorURL of origin + basePath + authPages.error when the origin is pinned', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      config: { basePath: '/base' },
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.onAPIError).toEqual({ errorURL: 'https://app.example.com/base/auth/error' });
  });

  test('falls back to the app-relative error path when the origin is not pinned', () => {
    delete process.env.BETTER_AUTH_URL;
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.onAPIError).toEqual({ errorURL: '/auth/error' });
  });

  test('honours a custom authPages.error path', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        authPages: { signIn: '/login', error: '/oops' },
      }),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.onAPIError).toEqual({ errorURL: 'https://app.example.com/oops' });
  });
});

describe('two factor challenge on the magic link path', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

  beforeEach(() => {
    mockBeginTwoFactorChallenge.mockClear();
  });

  afterEach(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  function createMagicLinkTwoFactorAuthJson() {
    return createAuthJson({
      authPages: { signIn: '/login', error: '/auth/error', twoFactor: '/two-factor' },
      email: emailConfig,
      magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
      twoFactor: { enabled: true },
    });
  }

  // A completed magic-link sign-in for an enrolled user, mid-redirect to the
  // destination the endpoint resolved from the link's callbackURL.
  function createVerifyCtx() {
    return {
      path: '/magic-link/verify',
      context: {
        newSession: {
          user: { id: 'user_1', twoFactorEnabled: true },
          session: { token: 'session_token_1' },
        },
        responseHeaders: new Headers({ location: 'https://app.example.com/base/invoices/123' }),
      },
    };
  }

  test('redirects an enrolled magic link sign-in to the basePath-prefixed absolute two factor page', async () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createMagicLinkTwoFactorAuthJson(),
      config: { basePath: '/base' },
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });

    // createAuthMiddleware supplies the real ctx.redirect, so the hook throws the
    // 302 APIError that runAfterHooks turns into the response.
    const thrown = await options.hooks.after(createVerifyCtx()).catch((error) => error);
    expect(thrown.statusCode).toBe(302);
    expect(thrown.headers.get('location')).toBe(
      'https://app.example.com/base/two-factor?callbackUrl=%2Fbase%2Finvoices%2F123'
    );
  });

  test('leaves /magic-link/verify alone when twoFactor is not enabled', async () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        authPages: { signIn: '/login', error: '/auth/error', twoFactor: '/two-factor' },
        email: emailConfig,
        magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
      }),
      config: { basePath: '/base' },
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });

    await expect(options.hooks.after(createVerifyCtx())).resolves.toBeUndefined();
    expect(mockBeginTwoFactorChallenge).not.toHaveBeenCalled();
  });
});

test('assembles both request hook slots when magicLink is enabled', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson({
      email: {
        connectionId: 'auth_email',
      },
      magicLink: { enabled: true, expiresIn: 300, disableSignUp: false },
    }),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(typeof options.hooks.before).toBe('function');
  expect(typeof options.hooks.after).toBe('function');
});

test('always assembles both request hook slots even with no magic link configured', () => {
  const options = getBetterAuthConfig({
    appMeta,
    authJson: createAuthJson(),
    getAuth,
    logger: createLogger(),
    plugins: createPlugins(),
    secrets: baseSecrets,
  });
  expect(Object.keys(options.hooks)).toEqual(['before', 'after']);
  expect(typeof options.hooks.before).toBe('function');
  expect(typeof options.hooks.after).toBe('function');
});

describe('oauthProvider authorization server plugins', () => {
  const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

  afterEach(() => {
    if (originalBetterAuthUrl === undefined) {
      delete process.env.BETTER_AUTH_URL;
    } else {
      process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
    }
  });

  function createOAuthProviderAuthJson(oauthProviderOverrides = {}) {
    return createAuthJson({
      oauthProvider: {
        consentPage: '/oauth/consent',
        dynamicClientRegistration: false,
        ...oauthProviderOverrides,
      },
    });
  }

  function getOAuthOptions(oauthProviderOverrides = {}, config = undefined) {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    return getBetterAuthConfig({
      appMeta,
      authJson: createOAuthProviderAuthJson(oauthProviderOverrides),
      config,
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
  }

  test('registers no jwt, oauth-provider or cimd plugin when oauthProvider is not configured', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson(),
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    expect(options.plugins.some((p) => p.id === 'jwt')).toBe(false);
    expect(options.plugins.some((p) => p.id === 'oauth-provider')).toBe(false);
    expect(options.plugins.some((p) => p.id === 'cimd')).toBe(false);
    expect(options.disabledPaths).not.toContain('/token');
  });

  test('throws ConfigError naming BETTER_AUTH_URL when oauthProvider is configured without a pinned origin', () => {
    delete process.env.BETTER_AUTH_URL;
    expect(() =>
      getBetterAuthConfig({
        appMeta,
        authJson: createOAuthProviderAuthJson(),
        getAuth,
        logger: createLogger(),
        plugins: createPlugins(),
        secrets: baseSecrets,
      })
    ).toThrow(ConfigError);
    expect(() =>
      getBetterAuthConfig({
        appMeta,
        authJson: createOAuthProviderAuthJson(),
        getAuth,
        logger: createLogger(),
        plugins: createPlugins(),
        secrets: baseSecrets,
      })
    ).toThrow('Auth "oauthProvider" requires the BETTER_AUTH_URL environment variable');
  });

  test('registers the core jwt plugin before the oauth-provider with /token disabled and no session JWT header', () => {
    const options = getOAuthOptions();
    const jwtIndex = options.plugins.findIndex((p) => p.id === 'jwt');
    const oauthIndex = options.plugins.findIndex((p) => p.id === 'oauth-provider');
    expect(jwtIndex).toBeGreaterThan(-1);
    expect(oauthIndex).toBeGreaterThan(jwtIndex);
    const jwtPlugin = options.plugins[jwtIndex];
    expect(jwtPlugin.options).toEqual({ disableSettingJwtHeader: true });
    // No jwt.issuer override - the AS then issues and advertises
    // BETTER_AUTH_URL + basePath as its issuer.
    expect(jwtPlugin.options.jwt).toBeUndefined();
    expect(options.disabledPaths).toContain('/token');
  });

  test('configures the oauth-provider with the closed mcp scope vocabulary and JWT access tokens', () => {
    const options = getOAuthOptions();
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    // offline_access is the refresh-token opt-in: without it the provider
    // issues no refresh token and every MCP client re-consents hourly.
    expect(plugin.options.scopes).toEqual(['mcp:read', 'mcp:write', 'offline_access']);
    expect(plugin.options.grantTypes).toEqual(['authorization_code', 'refresh_token']);
    // disableJwtPlugin false is the JWT access-token mode - opaque tokens off.
    expect(plugin.options.disableJwtPlugin).toBe(false);
    expect(plugin.options.enforcePerClientResources).toBe(false);
    expect(plugin.options.customAccessTokenClaims({ referenceId: 'org_1' })).toEqual({
      organization_id: 'org_1',
    });
    expect(plugin.options.resources).toBeUndefined();
    expect(plugin.options.dpop).toBeUndefined();
  });

  test('denies every HTTP resource-CRUD action through resourcePrivileges', () => {
    const options = getOAuthOptions();
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    ['create', 'read', 'update', 'delete', 'list', 'link', 'unlink'].forEach((action) => {
      expect(plugin.options.resourcePrivileges({ action })).toBe(false);
    });
  });

  test('resolves the consent and login pages to absolute basePath-prefixed routes', () => {
    const options = getOAuthOptions({}, { basePath: '/base' });
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    expect(plugin.options.consentPage).toBe('https://app.example.com/base/oauth/consent');
    expect(plugin.options.loginPage).toBe('https://app.example.com/base/login');
  });

  test('skips the post-login organization choice under the pinned policy and references the pinned org', () => {
    const options = getOAuthOptions();
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    expect(plugin.options.postLogin.shouldRedirect({ session: {} })).toBe(false);
    expect(plugin.options.postLogin.consentReferenceId({ session: {} })).toBe('default');
    // Never redirected to under pinned, but the plugin requires a page.
    expect(plugin.options.postLogin.page).toBe('https://app.example.com/oauth/consent');
  });

  test('redirects every authorization to the post-login page and references the active org under the tenant policy', () => {
    process.env.BETTER_AUTH_URL = 'https://app.example.com';
    const options = getBetterAuthConfig({
      appMeta,
      authJson: createAuthJson({
        organizations: { policy: 'tenant', signup: 'open', create: 'auto' },
        oauthProvider: {
          consentPage: '/oauth/consent',
          postLoginPage: '/oauth/select-organization',
          dynamicClientRegistration: false,
        },
      }),
      config: { basePath: '/base' },
      getAuth,
      logger: createLogger(),
      plugins: createPlugins(),
      secrets: baseSecrets,
    });
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    expect(plugin.options.postLogin.page).toBe(
      'https://app.example.com/base/oauth/select-organization'
    );
    expect(
      plugin.options.postLogin.shouldRedirect({ session: { activeOrganizationId: 'org_1' } })
    ).toBe(true);
    expect(
      plugin.options.postLogin.consentReferenceId({ session: { activeOrganizationId: 'org_1' } })
    ).toBe('org_1');
    let error;
    try {
      plugin.options.postLogin.consentReferenceId({ session: {} });
    } catch (thrown) {
      error = thrown;
    }
    expect(error.body).toEqual({
      error: 'invalid_request',
      error_description:
        'No organization was selected for this authorization. Choose an organization and try again.',
    });
  });

  test('leaves dynamic client registration disabled by default', () => {
    const options = getOAuthOptions();
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    expect(plugin.options.allowDynamicClientRegistration).toBe(false);
    expect(plugin.options.allowUnauthenticatedClientRegistration).toBe(false);
  });

  test('enables open dynamic client registration when dynamicClientRegistration is true', () => {
    const options = getOAuthOptions({ dynamicClientRegistration: true });
    const plugin = options.plugins.find((p) => p.id === 'oauth-provider');
    expect(plugin.options.allowDynamicClientRegistration).toBe(true);
    expect(plugin.options.allowUnauthenticatedClientRegistration).toBe(true);
  });

  test('registers the cimd plugin alongside the oauth-provider', () => {
    const options = getOAuthOptions();
    expect(options.plugins.some((p) => p.id === 'cimd')).toBe(true);
  });
});
