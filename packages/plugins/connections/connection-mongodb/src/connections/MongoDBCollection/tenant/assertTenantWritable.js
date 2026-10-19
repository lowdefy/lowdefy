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

import { ConfigError } from '@lowdefy/errors';

// tenant: none lifts the wall's filter so a request can read rows of every
// organization; it never writes. The api refuses a write request type under it
// (resolveTenancy) and marks the guard readOnly; this is the connection's half,
// so a write the api could not classify (a plugin's walled client, a resolver
// called directly) is refused before it touches the collection.
function assertTenantWritable({ tenantGuard, requestType }) {
  if (tenantGuard?.readOnly !== true) {
    return;
  }
  throw new ConfigError(
    `${requestType} writes, and a request with tenant: none may only read. To write rows of one organization from a system run, call an endpoint with a CallApi step that names the "organization": its requests are filtered and stamped with that organization.`
  );
}

export default assertTenantWritable;
