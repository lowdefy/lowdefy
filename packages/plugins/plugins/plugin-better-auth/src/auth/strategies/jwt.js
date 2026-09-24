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
import { ConfigError, ServiceError } from '@lowdefy/errors';
import { ReservedKeyError, get, type } from '@lowdefy/helpers';

// Claim paths come from the strategy's YAML claimMapping, so a path segment
// can be a reserved key and make `get` throw. The throw would happen after
// jwtVerify has already succeeded - outside this strategy's token catch, and
// with no try/catch between here and the request middleware - so it would
// surface as an unlocated 500 on every request carrying a valid token. A
// reserved claim path resolves to no claim instead: the id claim then rejects
// the token, and any other mapping entry is skipped.
function readClaim({ claimPath, payload }) {
  try {
    return get(payload, claimPath);
  } catch (error) {
    if (error instanceof ReservedKeyError) return undefined;
    throw error;
  }
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
      throw new ConfigError(
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
      // A JWKS fetch failure is the key server being unavailable, not a bad
      // token - moving on to the next strategy would silently reject every
      // caller of this one, so it fails the request instead.
      // A failed JWKS fetch reaches jose as TypeError('fetch failed') with the
      // network code on its cause, so both levels are classified.
      if (ServiceError.isServiceError(error) || ServiceError.isServiceError(error.cause)) {
        throw new ServiceError(undefined, { cause: error.cause ?? error, service: 'JWKS' });
      }
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
