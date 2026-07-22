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
// for a request against a tenant connection, or fail closed.
//
// The request-level sentinel is three-valued (amendment-1):
// - No `tenant:` on the connection -> null verdict, nothing injected.
// - `tenant: 'none'` on the request/step/websocket -> null verdict. This is
//   the ONLY opt-out: a visible, reviewable statement at the point of use.
//   There is no silent fallback and no connection-level "off".
// - `tenant: 'authored'` on the request -> the verdict resolves exactly as
//   the default (an org-less caller is still rejected) and carries
//   authored: true, telling the connection resolver to AUDIT the request's
//   own tenant clause (stages the wall can not scope mechanically) instead
//   of injecting one. Aggregation-only; other operations refuse the marker.
// - Otherwise the caller must carry an organization (context.user.organizationId,
//   the active org in string form). System context (hook routines, scheduled
//   jobs) and strategy callers have none, so they fail here by design - the
//   wall never degrades to unscoped access.
//
// The connection-type contract check is a runtime belt-and-braces repeat of
// the build error (buildConnections validateTenant): build artifacts and the
// running server can drift, and a declared-but-unenforced wall must never be
// reachable.
function resolveTenant(context, { connection, connectionConfig, requestConfig }) {
  if (type.isNone(connectionConfig.tenant)) {
    return null;
  }
  if (connection.meta?.tenant !== true) {
    throw new ConfigError(
      `Connection type "${connectionConfig.type}" does not implement the tenant scoping contract, so "tenant" can not be enforced at connection "${connectionConfig.connectionId}".`,
      { configKey: connectionConfig['~k'] }
    );
  }
  if (requestConfig.tenant === 'none') {
    return null;
  }
  const field =
    connectionConfig.tenant === true ? 'organizationId' : connectionConfig.tenant.field;
  const value = context.user?.organizationId;
  if (!type.isString(value) || value === '') {
    const location =
      requestConfig.stepId ?? requestConfig.requestId ?? requestConfig.websocketId;
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
