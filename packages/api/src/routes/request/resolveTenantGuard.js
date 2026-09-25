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

// The write guard for the tenant: none opt-out.
//
// tenant: none runs a request outside the wall - resolveTenant returns a null
// verdict, so the connection neither filters nor stamps. That is what an
// org-less or cross-org chain needs, but it also meant nothing checked what
// the request WROTE: a tenant: none insert could land a row with a null or
// missing tenant field in a walled collection. No walled read can ever see
// that row, and the tenant preflight then refuses to serve the whole app on
// the next cold start. The row is bad data at the moment it is written, so it
// is refused at the moment it is written - one failed request naming its
// step, instead of an outage.
//
// The guard is { field } - the field the wall would have stamped. Connection
// types that implement the scoping contract assert it on every write under
// tenant: none: inserted and upserted rows must carry a non-empty string
// organization id, and updates may not null, unset or otherwise overwrite it
// with anything else. It is a separate resolver argument (not a variant of the
// verdict) so every connection type that already treats a null verdict as
// "unscoped" keeps working unchanged.
//
// Call after resolveTenant, which has already validated the connection's
// capability and field - this only decides whether the guard applies.
function resolveTenantGuard(context, { connection, connectionConfig, requestConfig }) {
  if (requestConfig.tenant !== 'none') {
    return null;
  }
  if ((context.organization?.policy ?? 'pinned') !== 'tenant') {
    return null;
  }
  if (connectionConfig.tenant === 'shared') {
    return null;
  }
  if (connection.meta?.tenant !== true) {
    return null;
  }
  const field = type.isObject(connectionConfig.tenant)
    ? connectionConfig.tenant.field
    : 'organization_id';
  return { field };
}

export default resolveTenantGuard;
