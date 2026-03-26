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

import { SignJWT } from 'jose';

const secret = 'test-secret-that-is-at-least-32-chars-long';

async function createTestToken(claims, options = {}) {
  const key = new TextEncoder().encode(options.secret ?? secret);
  return new SignJWT(claims)
    .setProtectedHeader({ alg: options.algorithm ?? 'HS256' })
    .setExpirationTime(options.exp ?? '1h')
    .sign(key);
}

test('verifyJwt returns decoded claims for valid token', async () => {
  const { default: verifyJwt } = await import('./verifyJwt.js');
  const token = await createTestToken({ sub: 'user-123', email: 'a@b.com', roles: ['admin'] });
  const result = await verifyJwt(token, { secret, algorithm: 'HS256' });
  expect(result.sub).toEqual('user-123');
  expect(result.email).toEqual('a@b.com');
  expect(result.roles).toEqual(['admin']);
});

test('verifyJwt throws for expired token', async () => {
  const { default: verifyJwt } = await import('./verifyJwt.js');
  const key = new TextEncoder().encode(secret);
  const token = await new SignJWT({ sub: 'user-123' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(key);
  await expect(verifyJwt(token, { secret, algorithm: 'HS256' })).rejects.toThrow();
});

test('verifyJwt throws for invalid secret', async () => {
  const { default: verifyJwt } = await import('./verifyJwt.js');
  const token = await createTestToken({ sub: 'user-123' });
  await expect(
    verifyJwt(token, { secret: 'wrong-secret-that-is-at-least-32-chars', algorithm: 'HS256' })
  ).rejects.toThrow();
});

test('verifyJwt throws for missing token', async () => {
  const { default: verifyJwt } = await import('./verifyJwt.js');
  await expect(verifyJwt(null, { secret, algorithm: 'HS256' })).rejects.toThrow();
  await expect(verifyJwt(undefined, { secret, algorithm: 'HS256' })).rejects.toThrow();
});
