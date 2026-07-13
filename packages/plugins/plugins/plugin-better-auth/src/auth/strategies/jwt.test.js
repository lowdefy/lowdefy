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

import http from 'node:http';
import { jest } from '@jest/globals';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';

import jwt from './jwt.js';

const hmacSecret = 's'.repeat(32);
const encodedSecret = new TextEncoder().encode(hmacSecret);

function mockLogger() {
  return { debug: jest.fn(), warn: jest.fn() };
}

async function signHmac(payload, { alg = 'HS256', ...options } = {}) {
  let builder = new SignJWT(payload).setProtectedHeader({ alg }).setIssuedAt();
  if (options.expirationTime !== null) {
    builder = builder.setExpirationTime(options.expirationTime ?? '5m');
  }
  if (options.issuer) {
    builder = builder.setIssuer(options.issuer);
  }
  if (options.audience) {
    builder = builder.setAudience(options.audience);
  }
  return builder.sign(encodedSecret);
}

function bearer(token) {
  return new Headers({ Authorization: `Bearer ${token}` });
}

test('jwt verify accepts a valid HMAC token and defaults id to the sub claim', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  const token = await signHmac({ sub: 'service-1' });
  const match = await verify({ headers: bearer(token), logger });
  expect(match).toEqual({ attributes: {}, roles: [], user: { id: 'service-1' } });
});

test('jwt verify maps claims per claimMapping including nested role and attribute paths', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: {
      secret: hmacSecret,
      algorithms: ['HS256'],
      claimMapping: {
        id: 'sub',
        email: 'email',
        roles: 'realm_access.roles',
        'attributes.branches': 'resource_access.branches',
      },
    },
    strategyId: 'service-jwt',
  });
  const token = await signHmac({
    sub: 'service-1',
    email: 'svc@example.com',
    realm_access: { roles: ['api-user', 'reporting'] },
    resource_access: { branches: ['north', 'east'] },
  });
  const match = await verify({ headers: bearer(token), logger });
  expect(match).toEqual({
    attributes: { branches: ['north', 'east'] },
    roles: ['api-user', 'reporting'],
    user: { id: 'service-1', email: 'svc@example.com' },
  });
});

test('jwt verify wraps a single string roles claim in an array and drops non-string entries', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: {
      secret: hmacSecret,
      algorithms: ['HS256'],
      claimMapping: { roles: 'role' },
    },
    strategyId: 'service-jwt',
  });
  const single = await verify({
    headers: bearer(await signHmac({ sub: 's', role: 'api-user' })),
    logger,
  });
  expect(single.roles).toEqual(['api-user']);
  const mixed = await verify({
    headers: bearer(await signHmac({ sub: 's', role: ['api-user', 7, null] })),
    logger,
  });
  expect(mixed.roles).toEqual(['api-user']);
  const invalid = await verify({
    headers: bearer(await signHmac({ sub: 's', role: { nested: true } })),
    logger,
  });
  expect(invalid.roles).toEqual([]);
});

test('jwt verify skips claim-mapped fields whose claims are missing', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: {
      secret: hmacSecret,
      algorithms: ['HS256'],
      claimMapping: { email: 'email', 'attributes.branches': 'branches' },
    },
    strategyId: 'service-jwt',
  });
  const match = await verify({ headers: bearer(await signHmac({ sub: 's' })), logger });
  expect(match).toEqual({ attributes: {}, roles: [], user: { id: 's' } });
});

test('jwt verify rejects a valid token whose mapped id claim is missing', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  const noSub = await verify({ headers: bearer(await signHmac({ email: 's@x.com' })), logger });
  expect(noSub).toBe(null);
  expect(logger.debug).toHaveBeenCalledWith(
    { event: 'auth_strategy_token_rejected', strategyId: 'service-jwt' },
    'Auth strategy "service-jwt" rejected a Bearer token: the "sub" id claim is missing.'
  );
  const mapped = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'], claimMapping: { id: 'uid' } },
    strategyId: 'service-jwt',
  });
  expect(await mapped({ headers: bearer(await signHmac({ sub: 's' })), logger })).toBe(null);
});

test('jwt verify rejects an expired token', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  const token = await new SignJWT({ sub: 's' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(encodedSecret);
  expect(await verify({ headers: bearer(token), logger })).toBe(null);
  expect(logger.debug).toHaveBeenCalled();
});

test('jwt verify rejects a token signed with an algorithm outside the allowlist', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  const token = await signHmac({ sub: 's' }, { alg: 'HS384' });
  expect(await verify({ headers: bearer(token), logger })).toBe(null);
});

test('jwt verify rejects an unsigned alg none token', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: 's' })).toString('base64url');
  expect(await verify({ headers: bearer(`${header}.${payload}.`), logger })).toBe(null);
});

test('jwt verify rejects wrong issuer and wrong audience', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: {
      secret: hmacSecret,
      algorithms: ['HS256'],
      issuer: 'https://auth.example.com',
      audience: 'my-api',
    },
    strategyId: 'service-jwt',
  });
  const wrongIssuer = await signHmac(
    { sub: 's' },
    { issuer: 'https://evil.example.com', audience: 'my-api' }
  );
  expect(await verify({ headers: bearer(wrongIssuer), logger })).toBe(null);
  const wrongAudience = await signHmac(
    { sub: 's' },
    { issuer: 'https://auth.example.com', audience: 'other-api' }
  );
  expect(await verify({ headers: bearer(wrongAudience), logger })).toBe(null);
  const valid = await signHmac(
    { sub: 's' },
    { issuer: 'https://auth.example.com', audience: 'my-api' }
  );
  expect(await verify({ headers: bearer(valid), logger })).not.toBe(null);
});

test('jwt verify returns null without an Authorization Bearer header', async () => {
  const logger = mockLogger();
  const verify = jwt({
    logger,
    properties: { secret: hmacSecret, algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  expect(await verify({ headers: new Headers({}), logger })).toBe(null);
  expect(
    await verify({ headers: new Headers({ Authorization: 'Basic dXNlcjpwYXNz' }), logger })
  ).toBe(null);
});

test('jwt warns at startup for an HMAC secret shorter than 32 characters', () => {
  const logger = mockLogger();
  jwt({
    logger,
    properties: { secret: 'short-secret', algorithms: ['HS256'] },
    strategyId: 'service-jwt',
  });
  expect(logger.warn).toHaveBeenCalledWith(
    'Auth strategy "service-jwt" "secret" is shorter than 32 characters. Use a long random value, e.g. `openssl rand -base64 32`.'
  );
});

test('jwt throws at startup when the secret did not resolve to a string', () => {
  const logger = mockLogger();
  expect(() =>
    jwt({
      logger,
      properties: { secret: { _secret: 'MISSING' }, algorithms: ['HS256'] },
      strategyId: 'service-jwt',
    })
  ).toThrow(
    'Auth strategy "service-jwt" "secret" did not resolve to a string. Check the _secret operator reference and that the secret is set.'
  );
});

describe('jwt verify with a JWKS endpoint', () => {
  let server;
  let jwksUri;
  let privateKey;

  beforeAll(async () => {
    const pair = await generateKeyPair('RS256');
    privateKey = pair.privateKey;
    const jwk = await exportJWK(pair.publicKey);
    jwk.alg = 'RS256';
    jwk.use = 'sig';
    jwk.kid = 'test-key';
    server = http.createServer((req, res) => {
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ keys: [jwk] }));
    });
    await new Promise((resolve) => server.listen(0, resolve));
    jwksUri = `http://127.0.0.1:${server.address().port}/jwks.json`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  test('jwt verify accepts a token signed by the JWKS key', async () => {
    const logger = mockLogger();
    const verify = jwt({
      logger,
      properties: { jwksUri, algorithms: ['RS256'] },
      strategyId: 'external-idp',
    });
    const token = await new SignJWT({ sub: 'idp-user' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(privateKey);
    const match = await verify({ headers: bearer(token), logger });
    expect(match).toEqual({ attributes: {}, roles: [], user: { id: 'idp-user' } });
  });

  test('jwt verify rejects a token signed by a different key', async () => {
    const logger = mockLogger();
    const verify = jwt({
      logger,
      properties: { jwksUri, algorithms: ['RS256'] },
      strategyId: 'external-idp',
    });
    const otherPair = await generateKeyPair('RS256');
    const token = await new SignJWT({ sub: 'idp-user' })
      .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(otherPair.privateKey);
    expect(await verify({ headers: bearer(token), logger })).toBe(null);
  });
});
