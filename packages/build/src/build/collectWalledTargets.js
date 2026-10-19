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

import { get, type } from '@lowdefy/helpers';

import tenantTargetKey from './tenantTargetKey.js';

// The walled collections: the target of every scoped connection (populated
// only under the tenant policy, in context.tenantConnectionIds), keyed by
// tenantTargetKey. Each entry names the first scoped connection that reads the
// collection and the tenant field it scopes on.
function collectWalledTargets({ connections, context }) {
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  const walledTargets = new Map();
  connections.forEach((connection) => {
    if (!context.tenantConnectionIds.has(connection.connectionId)) return;
    const tenantTarget = connectionMetas[connection.type]?.tenantTarget;
    if (!tenantTarget) return;
    const key = tenantTargetKey({
      connection,
      tenantTarget,
      collection: get(connection.properties, tenantTarget.collection),
    });
    if (key === null || walledTargets.has(key)) return;
    walledTargets.set(key, {
      connectionId: connection.connectionId,
      field: type.isObject(connection.tenant) ? connection.tenant.field : 'organization_id',
    });
  });
  return walledTargets;
}

export default collectWalledTargets;
