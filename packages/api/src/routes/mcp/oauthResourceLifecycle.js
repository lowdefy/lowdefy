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

import { type } from '@lowdefy/helpers';

import getMcpResourceBinding from './getMcpResourceBinding.js';

// Lifecycle of the one oauthResource row the authorization server validates
// MCP token audiences against. The resource is a property of the deployment,
// not of an organization - which organization a token acts in is a claim
// stamped at consent time - so a single row, identified by the canonical
// resource URI, is ensured once per process. The row is owned by this code;
// the oauth-provider's HTTP resource CRUD is closed (resourcePrivileges:
// () => false). The write follows the plugin's insertOnly seed stance: insert
// a missing row, never revert an existing one, so a row an operator disabled
// stays disabled through restarts. No-ops when no MCP resource binding is
// registered (the app is not an authorization server), and never throws into
// the request path that awaits it.
const model = 'oauthResource';

// Mirrors the oauth-provider's own seed row (buildSeedRow at 1.7.0): null
// policy columns mean "inherit the plugin-level default at issuance time".
function buildResourceRow({ identifier }) {
  const now = new Date();
  return {
    identifier,
    name: identifier,
    accessTokenTtl: null,
    refreshTokenTtl: null,
    signingAlgorithm: null,
    signingKeyId: null,
    allowedScopes: null,
    customClaims: null,
    dpopBoundAccessTokensRequired: false,
    disabled: false,
    policyVersion: 1,
    metadata: null,
    createdAt: now,
    updatedAt: now,
  };
}

async function insertResourceRowIfMissing({ adapter, identifier }) {
  const existing = await adapter.findOne({
    model,
    where: [{ field: 'identifier', value: identifier }],
  });
  // An existing row is never reverted - re-enabling a disabled row here would
  // silently undo a deliberate operator disable on every restart.
  if (existing) {
    return;
  }
  try {
    await adapter.create({ model, data: buildResourceRow({ identifier }) });
  } catch (error) {
    // A racing process inserted the row between the find and the create - the
    // unique identifier index rejected this write, so the wanted row exists.
    const winner = await adapter.findOne({
      model,
      where: [{ field: 'identifier', value: identifier }],
    });
    if (!winner) {
      throw error;
    }
  }
}

const ensuredByAuth = new WeakMap();

// Awaited per request in the api-context middleware, so it is memoized like
// resolvePinnedOrganization: after the first success it awaits an
// already-settled promise.
async function ensureMcpOauthResource({ auth, logger }) {
  const binding = getMcpResourceBinding({ auth });
  if (type.isNone(binding)) {
    return;
  }
  let promise = ensuredByAuth.get(auth);
  if (type.isNone(promise)) {
    promise = auth.$context
      .then(({ adapter }) =>
        insertResourceRowIfMissing({ adapter, identifier: binding.resourceUri })
      )
      .catch((error) => {
        // Do not memoize a failure - the next request retries.
        ensuredByAuth.delete(auth);
        throw error;
      });
    ensuredByAuth.set(auth, promise);
  }
  try {
    await promise;
  } catch (error) {
    // A briefly unreachable database must not fail every request from the
    // middleware - requests keep serving and the next one retries.
    logger.warn(
      { err: error },
      `Failed to ensure the oauthResource row "${binding.resourceUri}" for the MCP resource.`
    );
  }
}

export { ensureMcpOauthResource };
