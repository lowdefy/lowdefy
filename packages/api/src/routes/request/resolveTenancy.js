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

import { AuthenticationError, ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

// The engine computes the tenant verdict, the connection enforces it. This is
// the compute half, for a request, step or websocket against a connection:
// resolve the verdict (the tenant field and the caller's organization id the
// connection filters and stamps with) and the write guard (the field every
// row an unscoped write leaves behind must still carry), or fail closed.
// Both come from one call so no call site can resolve the verdict and forget
// the guard - the webhook verifier did until the two were folded together.
//
// The app's auth.organizations.policy sets the scoping default for every
// connection (amendment-3). Under tenant, a connection whose type implements
// the scoping contract (meta.tenant === true) is scoped unless it declares
// tenant: shared. Under pinned (the default, including apps with no auth or
// no organizations block) no connection is scoped and none can be - no
// verdict, no guard: no filter, no stamp, no audit, no fail-closed error. The
// one check that stays on under both policies is the contract check below: a
// tenant declaration on a type that can not honour it should fail on the
// current deployment, not on the day the app flips to tenant.
//
// The connection position accepts only the exception to the default:
// - `tenant: 'shared'` -> no verdict. Data deliberately shared across
//   organizations - the ONLY connection-level path out of the wall, visible
//   in the connection file. (`tenant: true` was removed with the inversion;
//   it restated the default and is a build error.) When the build found that
//   a scoped connection reads the same collection (connectionConfig.walled,
//   buildConnections markWalledSharedConnections), the shared connection's
//   writes land in a walled collection, so they get the write guard.
// - `tenant: { field }` -> scoped on that field instead of organization_id.
//
// Connection types declare their capability as meta.tenant: true implements
// the scoping contract, false is non-scopable (object storage, SMTP - never
// scoped, no declaration needed on its connections). A type declaring
// neither is a build error under tenant (buildConnections validateTenant);
// the checks here are runtime belt-and-braces repeats of the build errors,
// because build artifacts and the running server can drift, and a silently
// unscoped connection must never be reachable.
//
// The request-level sentinel is unchanged by the inversion (amendment-1):
// - `tenant: 'none'` on the request/step/websocket -> no verdict, and the
//   write guard. A visible, reviewable statement at the point of use - the
//   request-level opt-out for caller-less contexts. The opt-out lifts the
//   filter and the stamp, not the invariant that every walled row carries an
//   organization: the connection refuses a write that would leave a row
//   without one, and stamps the change-log record with the organization of
//   the row it records (stampChangeLog).
// - `tenant: 'authored'` on the request -> the verdict resolves exactly as
//   the default (an org-less caller is still rejected) and carries
//   authored: true, telling the connection resolver to AUDIT the request's
//   own tenant clause (stages the wall can not scope mechanically) instead
//   of injecting one. Aggregation-only; other operations refuse the marker.
// - Otherwise the caller must carry an organization (context.user.organization_id,
//   the active org in string form). System context (hook routines, scheduled
//   jobs) and strategy callers have none, so they fail here by design - the
//   wall never degrades to unscoped access.
const unscoped = { tenant: null, tenantGuard: null };

// The scoping contract is enforced by the connection package itself (the
// resolvers stamp writes, merge filters and guard unscoped writes), so a stamp
// of true is only serveable when the installed package carries the runtime
// meta. A build artifact claiming the contract for a runtime that does not
// implement it is version drift between build and server: the verdict or
// guard would be computed and then silently ignored, which is exactly the
// unscoped access the wall exists to prevent - refuse instead.
function assertRuntimeContract({ runtimeCapability, connectionConfig }) {
  if (runtimeCapability !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" does not implement the tenant scoping contract in the installed version, but the build artifact for connection "${connectionConfig.connectionId}" declares it. The build and the running server have drifted - rebuild the app with the installed version, or align the versions.`,
      { configKey: connectionConfig['~k'] }
    );
  }
}

// Belt-and-braces repeat of the build check: the wall stamps and matches the
// field as a single top-level document key, so a drifted artifact with a
// missing, empty, or dotted field must refuse rather than enforce on a key the
// read filters can never match.
function assertTenantField({ field, connectionConfig }) {
  if (!type.isString(field) || field === '' || field.includes('.')) {
    throw new ConfigError(
      `Connection "tenant.field" should be a non-empty top-level field name (no dots) at connection "${connectionConfig.connectionId}" — the tenant wall stamps and matches it as a single document key.`,
      { received: field, configKey: connectionConfig['~k'] }
    );
  }
}

function resolveSharedTenancy({ runtimeCapability, connectionConfig }) {
  if (type.isNone(connectionConfig.walled)) {
    return unscoped;
  }
  assertRuntimeContract({ runtimeCapability, connectionConfig });
  const { field } = connectionConfig.walled;
  assertTenantField({ field, connectionConfig });
  // A shared connection's change log is kept out of walled collections by the
  // build (validateSharedChangeLog), and its records belong to no
  // organization - so they are not stamped.
  return { tenant: null, tenantGuard: { field, stampChangeLog: false } };
}

function resolveTenancy(context, { connection, connectionConfig, requestConfig }) {
  // Capability resolves from the runtime connection export first, then from
  // the tenantCapability the build stamped onto the connection artifact
  // (buildConnections) — the same types.js declaration the build check
  // validated. The stamp is what lets non-scoping types (SMTP, SendGrid,
  // AxiosHttp, AI connections, third-party plugins) serve under
  // policy: tenant without every package mirroring meta.tenant onto its
  // runtime export; the runtime meta still wins when present, so a drifted
  // artifact can never downgrade a type that now enforces the contract.
  const runtimeCapability = connection.meta?.tenant;
  const capability = runtimeCapability ?? connectionConfig.tenantCapability;
  if (!type.isNone(connectionConfig.tenant) && capability !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "${connectionConfig.connectionId}".`,
      { configKey: connectionConfig['~k'] }
    );
  }
  if ((context.organization?.policy ?? 'pinned') !== 'tenant') {
    return unscoped;
  }
  if (connectionConfig.tenant === 'shared') {
    return resolveSharedTenancy({ runtimeCapability, connectionConfig });
  }
  if (capability === false) {
    return unscoped;
  }
  if (capability !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" declares no tenant capability, so connection "${connectionConfig.connectionId}" can not be served under auth.organizations.policy: tenant. The type must declare meta tenant: true (implements the scoping contract) or tenant: false (non-scopable).`,
      { configKey: connectionConfig['~k'] }
    );
  }
  assertRuntimeContract({ runtimeCapability, connectionConfig });
  const field = type.isObject(connectionConfig.tenant)
    ? connectionConfig.tenant.field
    : 'organization_id';
  assertTenantField({ field, connectionConfig });
  if (requestConfig.tenant === 'none') {
    return { tenant: null, tenantGuard: { field, stampChangeLog: true } };
  }
  const value = context.user?.organization_id;
  if (!type.isString(value) || value === '') {
    const location = requestConfig.stepId ?? requestConfig.requestId ?? requestConfig.websocketId;
    throw new AuthenticationError(
      `Request "${location}" reads tenant connection "${connectionConfig.connectionId}" but no caller organization resolved. System-context and strategy callers carry no organization - the wall fails closed for them. To run this request outside the wall, declare tenant: none on it and author the organization value explicitly.`
    );
  }
  if (requestConfig.tenant === 'authored') {
    return { tenant: { field, value, authored: true }, tenantGuard: null };
  }
  return { tenant: { field, value }, tenantGuard: null };
}

export default resolveTenancy;
