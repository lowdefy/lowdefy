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

// Lifecycle of the per-organization oauthResource rows the authorization
// server validates token audiences against: an organization exists ⇔ its
// resource row exists and is enabled, so a new org's /api/mcp/:org endpoint
// becomes a valid audience by row insert alone - no restart. The rows are
// owned by this code; the oauth-provider's HTTP resource CRUD is closed
// (resourcePrivileges: () => false). Every writer follows the plugin's
// insertOnly seed stance: insert a missing row, never revert an existing one,
// so a row an operator disabled stays disabled through creation retries and
// the startup reconcile. All three functions no-op when no MCP resource
// binding is registered (the app is not an authorization server), and none
// throws into its caller's request path.
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
  // silently undo a deliberate operator disable on every retry.
  if (existing) {
    return;
  }
  try {
    await adapter.create({
      model,
      data: buildResourceRow({ identifier }),
    });
  } catch (error) {
    // A racing writer inserted the row between the find and the create - the
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

async function ensureOauthResourceRow({ auth, logger, organizationId }) {
  const binding = getMcpResourceBinding({ auth });
  if (type.isNone(binding)) {
    return;
  }
  const identifier = `${binding.uriPrefix}${organizationId}`;
  try {
    const { adapter } = await auth.$context;
    await insertResourceRowIfMissing({ adapter, identifier });
  } catch (error) {
    // Callers sit on request paths (session mint, org endpoints, steps); a
    // failed row write must not fail the organization they just created.
    // The per-process reconcile pass is the self-heal.
    logger.warn(
      { err: error },
      `Failed to ensure the oauthResource row "${identifier}" for organization "${organizationId}".`
    );
  }
}

async function disableOauthResourceRow({ auth, logger, organizationId }) {
  const binding = getMcpResourceBinding({ auth });
  if (type.isNone(binding)) {
    return;
  }
  const identifier = `${binding.uriPrefix}${organizationId}`;
  try {
    const { adapter } = await auth.$context;
    await adapter.update({
      model,
      where: [{ field: 'identifier', value: identifier }],
      update: { disabled: true, updatedAt: new Date() },
    });
  } catch (error) {
    // Fires on the after seat of /organization/delete - the delete has already
    // committed, so failing the response cannot undo it. A dangling enabled
    // row guards an org whose membership the delete emptied: consent finds no
    // member, so a token for it is unmintable.
    logger.warn(
      { err: error },
      `Failed to disable the oauthResource row "${identifier}" for the deleted organization "${organizationId}".`
    );
  }
}

// The adapter factory caps an unbounded findMany at defaultFindManyLimit
// (100), so the reconcile pass pages until a short page.
const reconcilePageSize = 100;

async function reconcile({ auth, uriPrefix }) {
  const { adapter } = await auth.$context;
  let offset = 0;
  for (;;) {
    const organizations = await adapter.findMany({
      model: 'organization',
      limit: reconcilePageSize,
      offset,
      sortBy: { field: 'createdAt', direction: 'asc' },
    });
    for (const organization of organizations ?? []) {
      await insertResourceRowIfMissing({
        adapter,
        identifier: `${uriPrefix}${organization.id}`,
      });
    }
    if ((organizations ?? []).length < reconcilePageSize) {
      return;
    }
    offset += reconcilePageSize;
  }
}

const reconciledByAuth = new WeakMap();

// One insert-missing pass over every organization row per process - the
// self-heal for orgs that predate the authorization server or whose creation
// path failed its row write. Awaited per request in the api-context
// middleware, so it is memoized like resolvePinnedOrganization: after the
// first success it awaits an already-settled promise.
async function reconcileOauthResources({ auth, logger }) {
  const binding = getMcpResourceBinding({ auth });
  if (type.isNone(binding)) {
    return;
  }
  let promise = reconciledByAuth.get(auth);
  if (type.isNone(promise)) {
    promise = reconcile({ auth, uriPrefix: binding.uriPrefix }).catch((error) => {
      // Do not memoize a failure - the next request retries the pass.
      reconciledByAuth.delete(auth);
      throw error;
    });
    reconciledByAuth.set(auth, promise);
  }
  try {
    await promise;
  } catch (error) {
    // A briefly unreachable database must not fail every request from the
    // middleware - requests keep serving and the next one retries.
    logger.warn({ err: error }, 'Failed to reconcile the oauthResource rows for the process.');
  }
}

export { disableOauthResourceRow, ensureOauthResourceRow, reconcileOauthResources };
