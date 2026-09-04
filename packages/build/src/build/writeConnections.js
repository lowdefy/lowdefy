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

import { LowdefyInternalError } from '@lowdefy/errors';
import { type, serializer } from '@lowdefy/helpers';

async function writeConnections({ components, context }) {
  if (type.isNone(components.connections)) return;
  if (!type.isArray(components.connections)) {
    throw new LowdefyInternalError('Connections is not an array.');
  }
  const writePromises = components.connections.map(async (connection) => {
    await context.writeBuildArtifact(
      `connections/${connection.connectionId}.json`,
      serializer.serializeToString(connection)
    );
  });
  // Index of scoped connections, read by the server's tenant preflight
  // (resolveTenantPreflight) - connection artifacts are one file per id, so
  // without an index the server can not enumerate the walled set. Under the
  // inverted default (amendment-3) that set is every connection whose type
  // implements the scoping contract and which does not declare
  // tenant: shared. Written under both policies to keep the build
  // policy-deterministic; the preflight only consults it under
  // policy: tenant.
  const connectionMetas = context.typesMap?.connectionMetas ?? {};
  const tenantConnections = components.connections
    .filter(
      (connection) =>
        connectionMetas[connection.type]?.tenant === true && connection.tenant !== 'shared'
    )
    .map((connection) => ({
      connectionId: connection.connectionId,
      type: connection.type,
      tenant: connection.tenant,
    }));
  writePromises.push(
    context.writeBuildArtifact(
      'tenantConnections.json',
      serializer.serializeToString(tenantConnections)
    )
  );
  // The tenant indexes the build computed for validateTenantPipeline and
  // validateTenantPipeline, so the dev JIT page build - which never runs
  // buildConnections - can restore them and run the same checks on page
  // requests. Separate from tenantConnections.json on purpose: the server's
  // tenant preflight reads that one and must never see shared connections.
  writePromises.push(
    context.writeBuildArtifact(
      'tenantCollections.json',
      serializer.serializeToString({
        tenantConnections: Object.fromEntries(context.tenantConnections ?? new Map()),
        tenantCollectionMap: context.tenantCollectionMap ?? {},
      })
    )
  );
  return Promise.all(writePromises);
}

export default writeConnections;
