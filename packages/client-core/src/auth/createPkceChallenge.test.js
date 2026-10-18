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

import { createHash, randomBytes } from 'node:crypto';

import createPkceChallenge from './createPkceChallenge.js';

// The platform digest a shell would pass (expo-crypto's resolves an ArrayBuffer).
async function sha256(bytes) {
  const digest = createHash('sha256').update(bytes).digest();
  return digest.buffer.slice(digest.byteOffset, digest.byteOffset + digest.byteLength);
}

test('createPkceChallenge matches the RFC 7636 appendix B example', async () => {
  const verifierBytes = Uint8Array.from([
    116, 24, 223, 180, 151, 153, 224, 37, 79, 250, 96, 125, 216, 173, 187, 186, 22, 212, 37, 77,
    105, 214, 191, 240, 91, 88, 5, 88, 83, 132, 141, 121,
  ]);
  expect(await createPkceChallenge({ verifierBytes, sha256 })).toEqual({
    codeVerifier: 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
    codeChallengeMethod: 'S256',
  });
});

test('createPkceChallenge makes an 86-character verifier and its S256 challenge from 64 bytes', async () => {
  for (let run = 0; run < 20; run += 1) {
    const bytes = randomBytes(64);
    const { codeVerifier, codeChallenge } = await createPkceChallenge({
      verifierBytes: new Uint8Array(bytes),
      sha256,
    });
    expect(codeVerifier).toBe(bytes.toString('base64url'));
    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]{86}$/);
    expect(codeChallenge).toBe(createHash('sha256').update(codeVerifier).digest('base64url'));
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
  }
});

test.each([32, 33, 34, 96])(
  'createPkceChallenge encodes %i bytes as unpadded base64url',
  async (length) => {
    const bytes = randomBytes(length);
    const { codeVerifier } = await createPkceChallenge({
      verifierBytes: new Uint8Array(bytes),
      sha256,
    });
    expect(codeVerifier).toBe(bytes.toString('base64url'));
  }
);

test('createPkceChallenge hashes the verifier text, not the random bytes', async () => {
  const seen = [];
  await createPkceChallenge({
    verifierBytes: new Uint8Array(32),
    sha256: async (bytes) => {
      seen.push(bytes);
      return new Uint8Array(32);
    },
  });
  expect(new TextDecoder().decode(seen[0])).toBe('A'.repeat(43));
});

test.each([
  ['bytes that are not a Uint8Array', { verifierBytes: [1, 2, 3], sha256 }],
  ['fewer than 32 bytes', { verifierBytes: new Uint8Array(31), sha256 }],
  ['more than 96 bytes', { verifierBytes: new Uint8Array(97), sha256 }],
  ['no digest function', { verifierBytes: new Uint8Array(64) }],
])('createPkceChallenge throws for %s', async (_, input) => {
  await expect(createPkceChallenge(input)).rejects.toThrow('createPkceChallenge');
});
