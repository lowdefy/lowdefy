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
import { betterAuth } from 'better-auth';

import createAsMetadataHandler from './createAsMetadataHandler.js';
import getBetterAuthConfig from './getBetterAuthConfig.js';
import { getAsIssuer } from '../mcp/getMcpUri.js';

// Contract test against the installed @better-auth/oauth-provider and cimd
// releases: constructs a real BetterAuth instance from the assembled options
// (memory adapter - no database) and asserts the mounted authorization-server
// surface, so an upstream option rename or metadata change fails here instead
// of at runtime.

const ORIGIN = 'https://app.example.com';

const originalBetterAuthUrl = process.env.BETTER_AUTH_URL;

beforeEach(() => {
  process.env.BETTER_AUTH_URL = ORIGIN;
});

afterEach(() => {
  if (originalBetterAuthUrl === undefined) {
    delete process.env.BETTER_AUTH_URL;
  } else {
    process.env.BETTER_AUTH_URL = originalBetterAuthUrl;
  }
});

function createLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isLevelEnabled: jest.fn(() => false),
  };
}

function createAuth({ dynamicClientRegistration = false } = {}) {
  const options = getBetterAuthConfig({
    appMeta: { name: 'Test App', slug: 'test-app' },
    authJson: {
      configured: true,
      secret: { _secret: 'BETTER_AUTH_SECRET' },
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
      oauthProvider: { consentPage: '/oauth/consent', dynamicClientRegistration },
    },
    getAuth: () => ({}),
    logger: createLogger(),
    plugins: { adapters: {}, providers: {} },
    secrets: { BETTER_AUTH_SECRET: 'x'.repeat(32) },
  });
  return betterAuth(options);
}

test('serves the RFC 8414 metadata document with the mcp scope vocabulary and no client_credentials grant', async () => {
  const auth = createAuth();
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/.well-known/oauth-authorization-server`)
  );
  expect(response.status).toBe(200);
  const metadata = await response.json();
  expect(metadata.issuer).toBe(`${ORIGIN}/api/auth`);
  expect(metadata.authorization_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/authorize`);
  expect(metadata.token_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/token`);
  expect(metadata.jwks_uri).toBe(`${ORIGIN}/api/auth/jwks`);
  expect(metadata.introspection_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/introspect`);
  expect(metadata.revocation_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/revoke`);
  expect(metadata.scopes_supported).toEqual(['mcp:read', 'mcp:write', 'offline_access']);
  expect(metadata.code_challenge_methods_supported).toEqual(['S256']);
  expect(metadata.grant_types_supported).toEqual(['authorization_code', 'refresh_token']);
  expect(metadata.client_id_metadata_document_supported).toBe(true);
  expect(metadata.registration_endpoint).toBeUndefined();
});

test('keeps the OIDC surface dormant - no openid-configuration document is served', async () => {
  const auth = createAuth();
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/.well-known/openid-configuration`)
  );
  expect(response.status).toBe(404);
});

test('serves signing keys at /jwks and disables the session-JWT /token endpoint', async () => {
  const auth = createAuth();
  const jwksResponse = await auth.handler(new Request(`${ORIGIN}/api/auth/jwks`));
  expect(jwksResponse.status).toBe(200);
  const jwks = await jwksResponse.json();
  expect(jwks.keys.length).toBeGreaterThan(0);
  expect(jwks.keys[0].alg).toBeDefined();

  const tokenResponse = await auth.handler(new Request(`${ORIGIN}/api/auth/token`));
  expect(tokenResponse.status).toBe(404);
});

test('createAsMetadataHandler serves the same AS metadata document with issuer equal to getAsIssuer', async () => {
  const auth = createAuth();
  const handler = createAsMetadataHandler({ auth });
  const response = await handler(
    new Request(`${ORIGIN}/.well-known/oauth-authorization-server/api/auth`)
  );
  expect(response.status).toBe(200);
  const metadata = await response.json();
  expect(metadata.issuer).toBe(getAsIssuer({ config: {} }));
  const pluginResponse = await auth.handler(
    new Request(`${ORIGIN}/api/auth/.well-known/oauth-authorization-server`)
  );
  expect(metadata).toEqual(await pluginResponse.json());
});

test('advertises the registration endpoint only when dynamicClientRegistration is true', async () => {
  const auth = createAuth({ dynamicClientRegistration: true });
  const response = await auth.handler(
    new Request(`${ORIGIN}/api/auth/.well-known/oauth-authorization-server`)
  );
  const metadata = await response.json();
  expect(metadata.registration_endpoint).toBe(`${ORIGIN}/api/auth/oauth2/register`);
});
