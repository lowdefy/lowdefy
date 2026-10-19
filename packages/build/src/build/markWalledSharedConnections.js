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

import { get } from '@lowdefy/helpers';

import tenantTargetKey from './tenantTargetKey.js';

// A tenant: shared connection reads and writes across organizations, but when
// a scoped connection reads the same collection, every row the shared
// connection writes there lands behind the wall: a row without the tenant
// field is invisible to every walled read and makes the tenant preflight
// refuse to serve the app. The connection artifact is marked (walled) so the
// runtime gives the shared connection the unscoped write guard
// (resolveTenancy): every row it writes must carry a non-empty organization
// id. Reads stay unscoped - that is what shared is for.
//
// A collection name resolved at runtime (_secret, _payload) can not be
// compared, so such a connection is not marked.
function markWalledSharedConnections({ connections, context, walledTargets }) {
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  connections.forEach((connection) => {
    if (connection.tenant !== 'shared') return;
    const tenantTarget = connectionMetas[connection.type]?.tenantTarget;
    if (!tenantTarget) return;
    const key = tenantTargetKey({
      connection,
      tenantTarget,
      collection: get(connection.properties, tenantTarget.collection),
    });
    if (!walledTargets.has(key)) return;
    connection.walled = { ...walledTargets.get(key) };
  });
}

export default markWalledSharedConnections;
