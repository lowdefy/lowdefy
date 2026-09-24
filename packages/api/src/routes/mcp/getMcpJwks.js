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

import { createLocalJWKSet } from 'jose';
import { type } from '@lowdefy/helpers';

// Verification keys for MCP access tokens, read in-process from the jwks
// rows the core jwt plugin persists - the same rows /api/auth/jwks serves.
// Reading through the adapter keeps token verification free of a self-HTTP
// dependency: the server never needs to reach its own public origin to
// authenticate a request. Only the publicKey column is read - it is the
// plaintext JSON-serialized public JWK, while privateKey is encrypted with
// the BetterAuth secret and never needed for verification. The row id is
// the kid the plugin stamps on every token it signs.

// Mirrors the served JWKS: rows persisted before the alg column existed
// default to the plugin's EdDSA, and a rotated key stays servable for the
// plugin's 30-day grace window so tokens signed just before rotation still
// verify until they expire.
const DEFAULT_ALG = 'EdDSA';
const ROTATION_GRACE_MS = 30 * 24 * 3600 * 1000;

const resolverByAuth = new WeakMap();

async function loadKeySet({ auth }) {
  const { adapter } = await auth.$context;
  const rows = await adapter.findMany({ model: 'jwks' });
  const now = Date.now();
  const keys = (rows ?? [])
    .filter(
      (row) =>
        type.isNone(row.expiresAt) || new Date(row.expiresAt).getTime() + ROTATION_GRACE_MS > now
    )
    .map((row) => ({
      alg: row.alg ?? DEFAULT_ALG,
      ...(type.isNone(row.crv) ? {} : { crv: row.crv }),
      ...JSON.parse(row.publicKey),
      kid: row.id,
    }));
  return createLocalJWKSet({ keys });
}

function createKeyResolver({ auth }) {
  let keySetPromise = null;
  function load() {
    if (keySetPromise === null) {
      // A failed load is never cached - a transient adapter error must not
      // poison the resolver until restart.
      keySetPromise = loadKeySet({ auth }).catch((error) => {
        keySetPromise = null;
        throw error;
      });
    }
    return keySetPromise;
  }
  return async function resolveMcpKey(protectedHeader, token) {
    const keySet = await load();
    try {
      return await keySet(protectedHeader, token);
    } catch (error) {
      if (error?.code !== 'ERR_JWKS_NO_MATCHING_KEY') {
        throw error;
      }
      // An unknown kid can be a freshly rotated key this process has not
      // seen - refetch once so rotation never strands verification.
      keySetPromise = null;
      const refreshed = await load();
      return refreshed(protectedHeader, token);
    }
  };
}

// Returns a jose key resolver, cached per auth instance for the life of the
// process alongside the instance itself.
function getMcpJwks({ auth }) {
  let resolver = resolverByAuth.get(auth);
  if (resolver === undefined) {
    resolver = createKeyResolver({ auth });
    resolverByAuth.set(auth, resolver);
  }
  return resolver;
}

export default getMcpJwks;
