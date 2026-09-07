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

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { get, type } from '@lowdefy/helpers';

// Prototype-pollution vectors - build rejects reserved claimMapping fields,
// and reserved claim paths resolve to no claim here as defense in depth: the
// id claim then rejects the token, and any other mapping entry is skipped.
const reservedKeys = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

function readClaim({ claimPath, payload }) {
  if (String(claimPath).split('.').some((segment) => reservedKeys.has(segment))) {
    return undefined;
  }
  return get(payload, claimPath);
}

function toRoles(value) {
  if (type.isArray(value)) {
    return value.filter((role) => type.isString(role));
  }
  if (type.isString(value)) {
    return [value];
  }
  return [];
}

// JWT strategy - verifies third-party Bearer tokens locally with jose, HMAC
// (secret) or JWKS (jwksUri; createRemoteJWKSet caches keys and handles
// rotation). Build guarantees exactly one of secret/jwksUri and a non-empty
// algorithms allowlist - the allowlist is what stops an `alg: none` or
// downgraded-algorithm token from verifying.
function jwt({ logger, properties, strategyId }) {
  const { algorithms, audience, issuer, jwksUri, secret } = properties;
  const claimMapping = properties.claimMapping ?? {};
  let key;
  if (!type.isNone(secret)) {
    if (!type.isString(secret)) {
      throw new Error(
        `Auth strategy "${strategyId}" "secret" did not resolve to a string. Check the _secret operator reference and that the secret is set.`
      );
    }
    // Secrets are opaque at build time; strength checks are startup warnings.
    if (secret.length < 32) {
      logger.warn(
        `Auth strategy "${strategyId}" "secret" is shorter than 32 characters. Use a long random value, e.g. \`openssl rand -base64 32\`.`
      );
    }
    key = new TextEncoder().encode(secret);
  } else {
    key = createRemoteJWKSet(new URL(jwksUri));
  }

  return async function verify({ headers, logger: requestLogger }) {
    const authorization = headers.get('authorization');
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return null;
    }
    const token = authorization.slice('Bearer '.length).trim();
    let payload;
    try {
      ({ payload } = await jwtVerify(token, key, { algorithms, audience, issuer }));
    } catch (error) {
      // An invalid token is not this strategy's caller - resolution moves on
      // to the next strategy instead of failing the request.
      (requestLogger ?? logger).debug(
        { event: 'auth_strategy_token_rejected', strategyId, err: error },
        `Auth strategy "${strategyId}" rejected a Bearer token: ${error.message}`
      );
      return null;
    }
    const idClaim = claimMapping.id ?? 'sub';
    const id = readClaim({ claimPath: idClaim, payload });
    if (type.isNone(id)) {
      // A caller without an identity cannot be authenticated - a signed token
      // missing the id claim is rejected, not promoted to an id-less caller.
      (requestLogger ?? logger).debug(
        { event: 'auth_strategy_token_rejected', strategyId },
        `Auth strategy "${strategyId}" rejected a Bearer token: the "${idClaim}" id claim is missing.`
      );
      return null;
    }
    const user = { id };
    const attributes = {};
    let roles = [];
    Object.entries(claimMapping).forEach(([field, claimPath]) => {
      if (field === 'id') {
        return;
      }
      const value = readClaim({ claimPath, payload });
      if (field === 'roles') {
        roles = toRoles(value);
        return;
      }
      if (type.isNone(value)) {
        return;
      }
      if (field.startsWith('attributes.')) {
        attributes[field.slice('attributes.'.length)] = value;
        return;
      }
      user[field] = value;
    });
    return { attributes, roles, user };
  };
}

export default jwt;
