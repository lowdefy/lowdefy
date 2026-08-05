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
// the compute half: resolve the tenant field and the caller's organization id
// for a request against a scoped connection, or fail closed.
//
// The app's auth.organizations.policy sets the scoping default for every
// connection (amendment-3). Under tenant, a connection whose type implements
// the scoping contract (meta.tenant === true) is scoped unless it declares
// tenant: shared. Under pinned (the default, including apps with no auth or
// no organizations block) no connection is scoped and none can be - the
// verdict is null: no filter, no stamp, no audit, no fail-closed error. The
// one check that stays on under both policies is the contract check below: a
// tenant declaration on a type that can not honour it should fail on the
// current deployment, not on the day the app flips to tenant.
//
// The connection position accepts only the exception to the default:
// - `tenant: 'shared'` -> null verdict. Data deliberately shared across
//   organizations - the ONLY connection-level path out of the wall, visible
//   in the connection file. (`tenant: true` was removed with the inversion;
//   it restated the default and is a build error.)
// - `tenant: { field }` -> scoped on that field instead of organizationId.
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
// - `tenant: 'none'` on the request/step/websocket -> null verdict. A
//   visible, reviewable statement at the point of use - the request-level
//   opt-out for caller-less contexts.
// - `tenant: 'authored'` on the request -> the verdict resolves exactly as
//   the default (an org-less caller is still rejected) and carries
//   authored: true, telling the connection resolver to AUDIT the request's
//   own tenant clause (stages the wall can not scope mechanically) instead
//   of injecting one. Aggregation-only; other operations refuse the marker.
// - Otherwise the caller must carry an organization (context.user.organizationId,
//   the active org in string form). System context (hook routines, scheduled
//   jobs) and strategy callers have none, so they fail here by design - the
//   wall never degrades to unscoped access.
function resolveTenant(context, { connection, connectionConfig, requestConfig }) {
  const capability = connection.meta?.tenant;
  if (!type.isNone(connectionConfig.tenant) && capability !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" does not implement the tenant scoping contract, so "tenant" can not be declared at connection "${connectionConfig.connectionId}".`,
      { configKey: connectionConfig['~k'] }
    );
  }
  if ((context.organization?.policy ?? 'pinned') !== 'tenant') {
    return null;
  }
  if (connectionConfig.tenant === 'shared') {
    return null;
  }
  if (capability === false) {
    return null;
  }
  if (capability !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" declares no tenant capability, so connection "${connectionConfig.connectionId}" can not be served under auth.organizations.policy: tenant. The type must declare meta tenant: true (implements the scoping contract) or tenant: false (non-scopable).`,
      { configKey: connectionConfig['~k'] }
    );
  }
  if (requestConfig.tenant === 'none') {
    return null;
  }
  const field = type.isObject(connectionConfig.tenant)
    ? connectionConfig.tenant.field
    : 'organizationId';
  // Belt-and-braces repeat of the build check: the wall stamps and matches
  // the field as a single top-level document key, so a drifted artifact with
  // a missing, empty, or dotted field must refuse rather than enforce on a
  // key the read filters can never match.
  if (!type.isString(field) || field === '' || field.includes('.')) {
    throw new ConfigError(
      `Connection "tenant.field" should be a non-empty top-level field name (no dots) at connection "${connectionConfig.connectionId}" — the tenant wall stamps and matches it as a single document key.`,
      { received: field, configKey: connectionConfig['~k'] }
    );
  }
  const value = context.user?.organizationId;
  if (!type.isString(value) || value === '') {
    const location = requestConfig.stepId ?? requestConfig.requestId ?? requestConfig.websocketId;
    throw new AuthenticationError(
      `Request "${location}" reads tenant connection "${connectionConfig.connectionId}" but no caller organization resolved. System-context and strategy callers carry no organization - the wall fails closed for them. To run this request outside the wall, declare tenant: none on it and author the organization value explicitly.`
    );
  }
  if (requestConfig.tenant === 'authored') {
    return { field, value, authored: true };
  }
  return { field, value };
}

export default resolveTenant;
