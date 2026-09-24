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
import { exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose';

import getMcpJwks from './getMcpJwks.js';

async function generateJwksRow({ kid }) {
  const { privateKey, publicKey } = await generateKeyPair('EdDSA');
  return {
    privateKey,
    row: {
      id: kid,
      publicKey: JSON.stringify(await exportJWK(publicKey)),
      privateKey: 'encrypted-and-never-read',
      createdAt: new Date(),
      alg: 'EdDSA',
    },
  };
}

function mockAuth({ findMany }) {
  return { $context: Promise.resolve({ adapter: { findMany } }) };
}

async function sign({ kid, privateKey }) {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA', kid })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);
}

test('verifies against the cached key set without re-reading the adapter', async () => {
  const keyA = await generateJwksRow({ kid: 'kid_a' });
  const findMany = jest.fn().mockResolvedValue([keyA.row]);
  const auth = mockAuth({ findMany });

  const tokenOne = await sign({ kid: 'kid_a', privateKey: keyA.privateKey });
  const tokenTwo = await sign({ kid: 'kid_a', privateKey: keyA.privateKey });
  await jwtVerify(tokenOne, getMcpJwks({ auth }));
  await jwtVerify(tokenTwo, getMcpJwks({ auth }));

  expect(findMany).toHaveBeenCalledTimes(1);
  expect(findMany).toHaveBeenCalledWith({ model: 'jwks' });
});

test('refetches the key set once when a token presents an unknown kid after rotation', async () => {
  const keyA = await generateJwksRow({ kid: 'kid_a' });
  const keyB = await generateJwksRow({ kid: 'kid_b' });
  const findMany = jest
    .fn()
    .mockResolvedValueOnce([keyA.row])
    .mockResolvedValue([keyA.row, keyB.row]);
  const auth = mockAuth({ findMany });

  // Prime the cache with only the pre-rotation key.
  await jwtVerify(await sign({ kid: 'kid_a', privateKey: keyA.privateKey }), getMcpJwks({ auth }));
  await jwtVerify(await sign({ kid: 'kid_b', privateKey: keyB.privateKey }), getMcpJwks({ auth }));

  expect(findMany).toHaveBeenCalledTimes(2);
});

test('a kid unknown after the refetch still fails verification', async () => {
  const keyA = await generateJwksRow({ kid: 'kid_a' });
  const forged = await generateJwksRow({ kid: 'kid_z' });
  const findMany = jest.fn().mockResolvedValue([keyA.row]);
  const auth = mockAuth({ findMany });

  await expect(
    jwtVerify(await sign({ kid: 'kid_z', privateKey: forged.privateKey }), getMcpJwks({ auth }))
  ).rejects.toThrow();
  expect(findMany).toHaveBeenCalledTimes(2);
});

test('a failed key set load is not cached - the next verification retries the adapter', async () => {
  const keyA = await generateJwksRow({ kid: 'kid_a' });
  const findMany = jest
    .fn()
    .mockRejectedValueOnce(new Error('database unavailable'))
    .mockResolvedValue([keyA.row]);
  const auth = mockAuth({ findMany });
  const token = await sign({ kid: 'kid_a', privateKey: keyA.privateKey });

  await expect(jwtVerify(token, getMcpJwks({ auth }))).rejects.toThrow('database unavailable');
  await expect(jwtVerify(token, getMcpJwks({ auth }))).resolves.toBeDefined();
});

test('a key expired beyond the rotation grace window is excluded from the key set', async () => {
  const keyA = await generateJwksRow({ kid: 'kid_a' });
  keyA.row.expiresAt = new Date(Date.now() - 31 * 24 * 3600 * 1000);
  const findMany = jest.fn().mockResolvedValue([keyA.row]);
  const auth = mockAuth({ findMany });

  await expect(
    jwtVerify(await sign({ kid: 'kid_a', privateKey: keyA.privateKey }), getMcpJwks({ auth }))
  ).rejects.toThrow();
});
