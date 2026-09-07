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

import { createHash, timingSafeEqual } from 'node:crypto';
import { type } from '@lowdefy/helpers';

function sha256(value) {
  return createHash('sha256').update(value).digest();
}

// Static API key strategy - reads a dedicated header (default X-API-Key, set
// by build) and compares against the configured keys. Both sides are hashed
// to SHA-256 before timingSafeEqual: the digests are a fixed 32 bytes, so the
// comparison runs in constant time without a length fast-path that would leak
// key length through timing.
function apiKey({ logger, properties, strategyId }) {
  const headerName = properties.headerName;
  const keys = properties.keys.map((key, index) => {
    const keyId = type.isNone(key.id) ? String(index) : key.id;
    if (!type.isString(key.value)) {
      throw new Error(
        `Auth strategy "${strategyId}" key "${keyId}" did not resolve to a string. Check the _secret operator reference and that the secret is set.`
      );
    }
    // Secrets are opaque at build time; strength checks are startup warnings.
    if (key.value.length < 32) {
      logger.warn(
        `Auth strategy "${strategyId}" key "${keyId}" is shorter than 32 characters. Use a long random value, e.g. \`openssl rand -hex 32\`.`
      );
    }
    return { digest: sha256(key.value), id: keyId };
  });

  return async function verify({ headers }) {
    const presented = headers.get(headerName);
    if (!presented) {
      return null;
    }
    const presentedDigest = sha256(presented);
    const match = keys.find((key) => timingSafeEqual(presentedDigest, key.digest));
    if (type.isNone(match)) {
      return null;
    }
    // Synthetic caller id with per-key audit identity - the key index stands
    // in when the config sets no key id.
    return { user: { id: `apiKey:${strategyId}:${match.id}` } };
  };
}

export default apiKey;
